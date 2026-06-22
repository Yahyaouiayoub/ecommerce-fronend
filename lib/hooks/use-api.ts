"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseApiResult<T> {
  data: T | null
  error: unknown
  loading: boolean
  /** Reload data (bypasses cache, sets loading=true — use for manual refreshes). */
  reload: () => void
  /** Silently refresh data in the background without setting loading=true. */
  refresh: () => void
}

// ── In-flight request deduplication cache ────────────────────────
const inflightCache = new Map<string, Promise<unknown>>()
const dataCache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 30_000 // 30 seconds

// Incrementing counter used as fallback when toString() yields a generic body
let fnCounter = 0
const fnKeyMap = new Map<string, string>()

/**
 * Generates a stable cache key from the fetcher function's source.
 * Uses the function body as the key when possible (handles inline arrows).
 */
function getCacheKey(fn: () => unknown): string {
  // Try function body text — works for inline arrows like () => getCategories()
  const fnText = fn.toString()
  const existing = fnKeyMap.get(fnText)
  if (existing) return existing
  const key = `api_${++fnCounter}`
  fnKeyMap.set(fnText, key)
  return key
}

/**
 * Enhanced data-fetching hook with:
 * - In-flight request deduplication (same fetcher call shares one promise)
 * - Short-lived result cache (30s TTL; cleared on reload)
 * - Standard loading / error / reload pattern
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const cacheKey = getCacheKey(fetcher)

  const run = useCallback((silent?: boolean) => {
    let mounted = true

    // Silent refresh updates data without showing loading state
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    // Check short-lived data cache first (only for non-silent loads)
    if (!silent) {
      const cached = dataCache.get(cacheKey)
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setData(cached.data as T)
        setLoading(false)
        return () => { mounted = false }
      }
    }

    // Deduplicate in-flight requests
    if (!inflightCache.has(cacheKey)) {
      inflightCache.set(cacheKey, fetcher().finally(() => {
        inflightCache.delete(cacheKey)
      }))
    }

    inflightCache.get(cacheKey)!
      .then((result) => {
        if (mounted) {
          dataCache.set(cacheKey, { data: result, ts: Date.now() })
          setData(result as T)
          if (!silent) setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
          if (!silent) setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps])

  useEffect(() => {
    const cleanup = run()
    return cleanup
  }, [run])

  // Reload — clears cache, shows loading state
  const reload = useCallback(() => {
    dataCache.delete(cacheKey)
    inflightCache.delete(cacheKey)
    run(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, cacheKey])

  // Silent refresh — clears cache, does NOT show loading state
  const refresh = useCallback(() => {
    dataCache.delete(cacheKey)
    inflightCache.delete(cacheKey)
    run(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, cacheKey])

  return { data, error, loading, reload, refresh }
}