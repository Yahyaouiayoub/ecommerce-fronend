import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useApi, useSharedData } from "./use-api"

// ---------------------------------------------------------------------------
// NOTE: Cache key collision prevention
//
// The module-level dataCache is shared across all tests in this file.
// getCacheKey() uses fn.toString() as part of the key, and all vi.fn()
// instances produce the same .toString() output. To avoid one test finding
// another test's cached data, each useApi call passes a unique deps value
// ("test-<name>") so that cache entries are properly isolated.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// useApi
// ---------------------------------------------------------------------------

describe("useApi", () => {
  it("fetches data and transitions through loading states", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useApi(fetcher, ["basic-fetch"]))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual({ id: 1 })
    expect(result.current.error).toBeNull()
  })

  it("surfaces errors when fetch fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("boom"))
    const { result } = renderHook(() => useApi(fetcher, ["surfaces-errors"]))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error).toEqual(new Error("boom"))
    expect(result.current.data).toBeNull()
  })

  it("re-fetches when deps change", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    let deps: unknown[] = ["re-fetch-v1"]
    const { result, rerender } = renderHook(() => useApi(fetcher, deps))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Change deps — triggers a new fetch (new cache key, so always fresh)
    deps = ["re-fetch-v2"]
    rerender()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("shows loading when deps change", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    let deps: unknown[] = ["loading-v1"]
    const { result, rerender } = renderHook(() => useApi(fetcher, deps))

    await waitFor(() => expect(result.current.loading).toBe(false))

    deps = ["loading-v2"]
    rerender()

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  // -----------------------------------------------------------------------
  // staleTime caching
  // -----------------------------------------------------------------------

  it("returns cached data without refetch within staleTime", async () => {
    const fetcher = vi.fn().mockResolvedValue("cached-value")
    const { rerender } = renderHook(() =>
      useApi(fetcher, ["cached-test"], { staleTime: 60_000 }),
    )

    // Wait for the initial fetch
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    // Rerender with same deps — should use cache, never re-fetch
    rerender()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("serves cached data to concurrent callers with same key", async () => {
    const fetcher = vi.fn().mockResolvedValue("shared-cache")

    const hook1 = renderHook(() => useApi(fetcher, ["concurrent-cache"], { staleTime: 60_000 }))
    await waitFor(() => expect(hook1.result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Second hook with same fetcher + deps — should use cached data
    const hook2 = renderHook(() => useApi(fetcher, ["concurrent-cache"], { staleTime: 60_000 }))
    expect(hook2.result.current.data).toBe("shared-cache")
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  // -----------------------------------------------------------------------
  // Inflight request deduplication
  // -----------------------------------------------------------------------

  it("deduplicates concurrent requests with the same key", async () => {
    let resolve: (v: unknown) => void
    const slowPromise = new Promise((r) => {
      resolve = r
    })
    const fetcher = vi.fn().mockReturnValue(slowPromise)

    const hook1 = renderHook(() => useApi(fetcher, ["dedup-key"]))
    const hook2 = renderHook(() => useApi(fetcher, ["dedup-key"]))

    // Both should be loading
    expect(hook1.result.current.loading).toBe(true)
    expect(hook2.result.current.loading).toBe(true)

    // Resolve the shared promise
    await act(async () => {
      resolve!("deduped-value")
    })

    await waitFor(() => {
      expect(hook1.result.current.loading).toBe(false)
      expect(hook2.result.current.loading).toBe(false)
    })

    // Fetcher called only once because inflight cache deduped the second call
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(hook1.result.current.data).toBe("deduped-value")
    expect(hook2.result.current.data).toBe("deduped-value")
  })

  // -----------------------------------------------------------------------
  // reload vs refresh
  // -----------------------------------------------------------------------

  it("reload clears cache and re-fetches", async () => {
    const fetcher = vi.fn().mockResolvedValue({ version: 1 })
    const { result } = renderHook(() => useApi(fetcher, ["reload-test"]))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.reload()
    })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })

  it("refresh silently updates without showing loading", async () => {
    // Deferred promise for the first fetch
    let resolveFirst: (v: unknown) => void
    const firstPromise = new Promise((r) => {
      resolveFirst = r
    })
    const fetcher = vi.fn().mockReturnValue(firstPromise)

    const { result } = renderHook(() => useApi(fetcher, ["refresh-test"]))

    // Resolve the first fetch
    await act(async () => {
      resolveFirst!("initial")
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe("initial")

    // Make refresh resolve immediately
    fetcher.mockResolvedValue("refreshed")

    // Refresh — should NOT set loading=true
    act(() => {
      result.current.refresh()
    })

    // loading stays false during silent refresh
    expect(result.current.loading).toBe(false)
    // data still shows old value while refreshing
    expect(result.current.data).toBe("initial")

    await waitFor(() => expect(result.current.data).toBe("refreshed"))
    // loading never went true
    expect(result.current.loading).toBe(false)
  })

  // -----------------------------------------------------------------------
  // keepPreviousData
  // -----------------------------------------------------------------------

  it("keepPreviousData retains old data while loading new deps", async () => {
    let resolvePage2: (v: unknown) => void
    const fetcher = vi.fn().mockImplementation(() => {
      if (fetcher.mock.calls.length === 1) {
        return Promise.resolve("page-1")
      }
      return new Promise((r) => {
        resolvePage2 = r
      })
    })
    let deps: unknown[] = ["keep-old-v1"]
    const { result, rerender } = renderHook(() =>
      useApi(fetcher, deps, { keepPreviousData: true }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe("page-1")

    // Change deps — keepPreviousData should retain old value during loading
    deps = ["keep-old-v2"]
    rerender()

    // Old data preserved while loading
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe("page-1")

    // Now resolve the second fetch with the correct value
    await act(async () => {
      resolvePage2!("page-2")
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe("page-2")
  })
})

// ---------------------------------------------------------------------------
// useSharedData (singleton cache)
// ---------------------------------------------------------------------------

describe("useSharedData", () => {
  it("returns data and loading states", async () => {
    const fetcher = vi.fn().mockResolvedValue("shared-value")
    const { result } = renderHook(() => useSharedData("sd-key-1", fetcher))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe("shared-value")
  })

  it("serves cached value to concurrent callers once", async () => {
    const fetcher = vi.fn().mockResolvedValue("singleton")

    const hook1 = renderHook(() => useSharedData("sd-key-2", fetcher))
    const hook2 = renderHook(() => useSharedData("sd-key-2", fetcher))

    await waitFor(() => expect(hook1.result.current.loading).toBe(false))
    await waitFor(() => expect(hook2.result.current.loading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(hook1.result.current.data).toBe("singleton")
    expect(hook2.result.current.data).toBe("singleton")
  })

  it("uses different cache keys independently", async () => {
    const fetcherA = vi.fn().mockResolvedValue("data-a")
    const fetcherB = vi.fn().mockResolvedValue("data-b")

    const hookA = renderHook(() => useSharedData("sd-key-a", fetcherA))
    const hookB = renderHook(() => useSharedData("sd-key-b", fetcherB))

    await waitFor(() => expect(hookA.result.current.loading).toBe(false))
    await waitFor(() => expect(hookB.result.current.loading).toBe(false))

    expect(fetcherA).toHaveBeenCalledTimes(1)
    expect(fetcherB).toHaveBeenCalledTimes(1)
    expect(hookA.result.current.data).toBe("data-a")
    expect(hookB.result.current.data).toBe("data-b")
  })

  it("surfaces errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("shared-boom"))
    const { result } = renderHook(() => useSharedData("sd-key-error", fetcher))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error).toEqual(new Error("shared-boom"))
    expect(result.current.data).toBeNull()
  })
})
