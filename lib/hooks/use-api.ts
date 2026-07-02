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

interface UseApiOptions {
  /** Keep showing the previous data while new data is loading (prevents UI flicker). */
  keepPreviousData?: boolean
  /** How long (ms) cached data is considered fresh. Default 60s. */
  staleTime?: number
}

// ── In-flight request deduplication cache ────────────────────────
const inflightCache = new Map<string, Promise<unknown>>()
const dataCache = new Map<string, { data: unknown; ts: number }>()
const DEFAULT_CACHE_TTL = 60_000 // 60 seconds

// Incrementing counter used as fallback when toString() yields a generic body
let fnCounter = 0
const fnKeyMap = new Map<string, string>()

/**
 * Generates a stable cache key from the fetcher function's source and its dependencies.
 *
 * Including the deps ensures the cache differentiates between calls with different
 * arguments (e.g. category filters, search queries, page numbers). Without this,
 * inline arrows like `() => getProducts(query)` always stringify to the same
 * source, causing stale cached data to be returned when filter params change.
 */
function getCacheKey(fn: () => unknown, deps: unknown[]): string {
  const fnText = fn.toString()
  // Serialize deps into the key so different filter states get unique entries
  const depFingerprint = deps
    .map((d) => (typeof d === "object" || typeof d === "undefined" ? "" : String(d)))
    .join("‣")
  const combined = `${fnText}::${depFingerprint}`
  const existing = fnKeyMap.get(combined)
  if (existing) return existing
  const key = `api_${++fnCounter}`
  fnKeyMap.set(combined, key)
  return key
}

/**
 * Enhanced data-fetching hook with:
 * - In-flight request deduplication (same fetcher call shares one promise)
 * - Configurable staleTime (default 60s) — set a longer TTL for data that
 *   changes infrequently (e.g. homepage sections)
 * - keepPreviousData (stale data stays visible during background refetch)
 * - Standard loading / error / reload pattern
 *
 * Note: No AbortController — the mounted flag already prevents state
 * updates on unmounted components, and using AbortSignal would corrupt
 * the inflight cache when effects re-run (StrictMode, fast navigation).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: UseApiOptions,
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const prevDataRef = useRef<T | null>(null)
  const staleTime = options?.staleTime ?? DEFAULT_CACHE_TTL
  const cacheKey = getCacheKey(fetcher, deps)

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
      if (cached && Date.now() - cached.ts < staleTime) {
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
          prevDataRef.current = result as T
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
    return () => {
      cleanup?.()
    }
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

  // When keepPreviousData is enabled and we have previous data, keep showing it during loading
  const displayData = options?.keepPreviousData && loading && prevDataRef.current
    ? prevDataRef.current
    : data

  return { data: displayData, error, loading, reload, refresh }
}

// ── Shared singleton fetchers (eliminate duplicate requests across components) ──
//
// These use module-level promise caching so that if multiple components mount
// simultaneously (e.g. navbar + footer + homepage all need getPublicSettings),
// only ONE network request is ever made. The promise is shared.

const singletonCache = new Map<string, { promise: Promise<unknown>; data: unknown | null; ts: number }>()

/**
 * useSharedData — Fetches data once and shares the result across all callers.
 * Subsequent calls return the cached data immediately without a network request.
 * The optional staleTime controls how often the data is refreshed.
 */
export function useSharedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  staleTime: number = 5 * 60 * 1000, // default 5 minutes
): { data: T | null; loading: boolean; error: unknown } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const cached = singletonCache.get(key)

    // Return cached data only if it's still fresh (within staleTime)
    if (cached && cached.data !== null && Date.now() - cached.ts < staleTime) {
      setData(cached.data as T)
      setLoading(false)
      return
    }

    // If there's a pending promise (from a concurrent caller), subscribe to it
    if (cached?.promise) {
      cached.promise
        .then((result) => {
          if (mounted) {
            singletonCache.set(key, { promise: cached.promise, data: result, ts: Date.now() })
            setData(result as T)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (mounted) { setError(err); setLoading(false) }
        })
      return
    }

    const promise = fetcher()
    singletonCache.set(key, { promise, data: null, ts: Date.now() })

    promise
      .then((result) => {
        if (mounted) {
          singletonCache.set(key, { promise, data: result, ts: Date.now() })
          setData(result as T)
          setLoading(false)
          // Schedule cache eviction after staleTime
          setTimeout(() => singletonCache.delete(key), staleTime)
        }
      })
      .catch((err) => {
        if (mounted) { setError(err); setLoading(false) }
      })

    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, staleTime])

  return { data, loading, error }
}