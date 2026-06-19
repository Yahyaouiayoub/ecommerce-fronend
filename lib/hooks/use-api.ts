"use client"

import { useCallback, useEffect, useState } from "react"

interface UseApiResult<T> {
  data: T | null
  error: unknown
  loading: boolean
  reload: () => void
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  const run = useCallback(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (mounted) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps -- deps are provided by caller
  }, deps)

  useEffect(() => {
    const cleanup = run()
    return cleanup
  }, [run])

  return { data, error, loading, reload: run }
}