import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePolling } from "./use-polling"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Original document.hidden descriptor (used to reset between tests). */
const ORIG_HIDDEN_DESC = Object.getOwnPropertyDescriptor(Document.prototype, "hidden")

/**
 * Temporarily override document.hidden and dispatch visibilitychange.
 * Returns a cleanup function that restores the original descriptor.
 */
function setDocumentHidden(hidden: boolean) {
  const origDescriptor = ORIG_HIDDEN_DESC
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  })
  document.dispatchEvent(new Event("visibilitychange"))
  return () => {
    if (origDescriptor) {
      Object.defineProperty(document, "hidden", origDescriptor)
    }
  }
}

// ---------------------------------------------------------------------------
// usePolling
// ---------------------------------------------------------------------------

describe("usePolling", () => {
  afterEach(() => {
    vi.useRealTimers()
    // Restore document.hidden to the default (prevents leaks between tests)
    if (ORIG_HIDDEN_DESC) {
      Object.defineProperty(document, "hidden", ORIG_HIDDEN_DESC)
    }
  })

  // ── Basic interval ────────────────────────────────────────────────

  it("calls a single callback at the given interval", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100))

    // No calls before advancing
    expect(cb).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(cb).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(cb).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(cb).toHaveBeenCalledTimes(4)
  })

  it("calls multiple callbacks at the given interval", () => {
    vi.useFakeTimers()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    renderHook(() => usePolling([cb1, cb2], 50))

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(cb1).toHaveBeenCalledTimes(2)
    expect(cb2).toHaveBeenCalledTimes(2)
  })

  // ── Callback ref (latest callback without restart) ────────────────

  it("calls the latest callback when callback ref updates (no interval restart)", () => {
    vi.useFakeTimers()
    const cb1 = vi.fn()
    const { rerender } = renderHook(
      ({ cb }) => usePolling(cb, 100),
      { initialProps: { cb: cb1 } },
    )

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(cb1).toHaveBeenCalledTimes(1)

    // Replace callback — the interval should NOT restart
    const cb2 = vi.fn()
    rerender({ cb: cb2 })

    act(() => {
      vi.advanceTimersByTime(100)
    })
    // cb1 should NOT be called again (replaced by cb2)
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)
  })

  // ── Visibility awareness ─────────────────────────────────────────

  it("stops polling when the tab is hidden and skipWhenHidden is true (default)", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100))

    // Let a few intervals fire
    act(() => { vi.advanceTimersByTime(200) })
    expect(cb).toHaveBeenCalledTimes(2)

    // Hide the tab
    const restore = setDocumentHidden(true)

    // Advance time — no new calls should happen
    act(() => { vi.advanceTimersByTime(500) })
    expect(cb).toHaveBeenCalledTimes(2) // still 2

    restore()
  })

  it("fires immediately on tab return and resumes polling", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100))

    // Initial interval fires
    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(1)

    // Hide the tab
    const restore1 = setDocumentHidden(true)

    // Advance past several intervals
    act(() => { vi.advanceTimersByTime(300) })
    expect(cb).toHaveBeenCalledTimes(1) // paused

    // Show the tab — should fire immediately and resume
    const restore2 = setDocumentHidden(false)

    // Immediate fire on return
    expect(cb).toHaveBeenCalledTimes(2)

    // Should continue polling
    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(3)

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(4)

    restore1()
    restore2()
  })

  it("continues polling regardless of visibility when skipWhenHidden=false", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100, false)) // skipWhenHidden = false

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(1)

    // Hide the tab
    const restore = setDocumentHidden(true)

    // Should still poll despite being hidden
    act(() => { vi.advanceTimersByTime(300) })
    expect(cb).toHaveBeenCalledTimes(4)

    restore()
  })

  it("does not add visibility listener when skipWhenHidden=false", () => {
    const addSpy = vi.spyOn(document, "addEventListener")
    const cb = vi.fn()

    renderHook(() => usePolling(cb, 100, false))

    const visibilityCalls = addSpy.mock.calls.filter(
      ([event]) => event === "visibilitychange",
    )
    expect(visibilityCalls).toHaveLength(0)

    addSpy.mockRestore()
  })

  it("does not fire on tab return when skipWhenHidden was always false", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100, false))

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(1)

    const restore = setDocumentHidden(true)
    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(2) // continued polling

    // Return — should NOT fire immediately (no visibility listener attached)
    setDocumentHidden(false)
    expect(cb).toHaveBeenCalledTimes(2) // no extra fire

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(3) // resumed normally

    restore()
  })

  // ── The hook does not start polling if document is already hidden ──

  it("does not start polling on mount when document is already hidden and skipWhenHidden=true", () => {
    vi.useFakeTimers()

    // Hide first
    const restore = setDocumentHidden(true)

    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100))

    // No intervals should fire while hidden
    act(() => { vi.advanceTimersByTime(500) })
    expect(cb).not.toHaveBeenCalled()

    restore()
  })

  // ── Cleanup ──────────────────────────────────────────────────────

  it("stops polling on unmount", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const { unmount } = renderHook(() => usePolling(cb, 100))

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(1)

    unmount()

    // Advance time — no calls after unmount
    act(() => { vi.advanceTimersByTime(1000) })
    expect(cb).toHaveBeenCalledTimes(1) // no more calls
  })

  it("removes visibility listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener")
    const cb = vi.fn()

    const { unmount } = renderHook(() => usePolling(cb, 100))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    )

    removeSpy.mockRestore()
  })

  it("starts polling when document was hidden on mount and becomes visible", () => {
    vi.useFakeTimers()

    // Mount while hidden
    const restore1 = setDocumentHidden(true)
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 100))

    act(() => { vi.advanceTimersByTime(500) })
    expect(cb).not.toHaveBeenCalled()

    // Tab becomes visible — should fire immediately and start polling
    const restore2 = setDocumentHidden(false)
    expect(cb).toHaveBeenCalledTimes(1) // immediate fire

    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(2)

    restore1()
    restore2()
  })

  // ── IntervalMs changes ───────────────────────────────────────────

  it("restarts polling when intervalMs changes", () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    const { rerender } = renderHook(
      ({ interval }) => usePolling(cb, interval),
      { initialProps: { interval: 100 } },
    )

    // Fire a few
    act(() => { vi.advanceTimersByTime(200) })
    expect(cb).toHaveBeenCalledTimes(2)

    // Change interval
    rerender({ interval: 50 })

    // Should now fire at 50ms
    act(() => { vi.advanceTimersByTime(100) })
    expect(cb).toHaveBeenCalledTimes(4) // 2 from before + 2 at new interval
  })
})
