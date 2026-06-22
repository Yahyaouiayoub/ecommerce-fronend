"use client"

import { useEffect, useRef } from "react"

type PollCallback = () => void

/**
 * Visibility-aware polling hook. Calls the given callback(s) at the given
 * interval only while the document is visible. Pauses when the tab is hidden
 * and resumes immediately when the user returns.
 *
 * Automatically cleans up on unmount.
 *
 * @example
 *   // Single callback
 *   usePolling(reloadOrders, 30_000)
 *
 *   // Multiple callbacks
 *   usePolling([reloadStats, reloadFinancial], 30_000)
 */
export function usePolling(
  callback: PollCallback | PollCallback[],
  intervalMs: number,
  skipWhenHidden = true,
): void {
  const ref = useRef<PollCallback | PollCallback[]>(callback)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const skipRef = useRef(skipWhenHidden)

  ref.current = callback
  skipRef.current = skipWhenHidden

  useEffect(() => {
    function start() {
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        const cb = ref.current
        if (Array.isArray(cb)) {
          cb.forEach((fn) => fn())
        } else {
          cb()
        }
      }, intervalMs)
    }

    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }

    function onVisibilityChange() {
      if (document.hidden && skipRef.current) {
        stop()
      } else if (!document.hidden && skipRef.current) {
        // Fire immediately on return, then resume polling
        const cb = ref.current
        if (Array.isArray(cb)) {
          cb.forEach((fn) => fn())
        } else {
          cb()
        }
        start()
      }
    }

    // Start polling
    if (!skipRef.current || !document.hidden) {
      start()
    }

    // Listen for visibility changes
    if (skipRef.current) {
      document.addEventListener("visibilitychange", onVisibilityChange)
    }

    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs])
}
