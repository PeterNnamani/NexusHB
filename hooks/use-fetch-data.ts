"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchJson } from "@/lib/fetch-json"

interface UseFetchDataOptions {
  enabled?: boolean
  timeoutMs?: number
}

/**
 * Loads JSON once on mount; `loading` is only true until the first attempt finishes.
 * Refetches set `refreshing` instead of blocking the UI with a full-page loader.
 */
export function useFetchData<T>(
  url: string | null,
  options: UseFetchDataOptions = {},
) {
  const { enabled = true, timeoutMs } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(enabled && url))
  const [refreshing, setRefreshing] = useState(false)
  const hasLoadedRef = useRef(false)

  const load = useCallback(
    async (silent = false) => {
      if (!enabled || !url) {
        setLoading(false)
        return null
      }

      if (silent && hasLoadedRef.current) {
        setRefreshing(true)
      } else if (!hasLoadedRef.current) {
        setLoading(true)
      }

      try {
        const result = await fetchJson<T>(url, { timeoutMs })
        setData(result)
        setError(null)
        hasLoadedRef.current = true
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data"
        setError(message)
        hasLoadedRef.current = true
        return null
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [enabled, url, timeoutMs],
  )

  useEffect(() => {
    hasLoadedRef.current = false
    setData(null)
    setError(null)
    if (enabled && url) {
      setLoading(true)
      void load()
    } else {
      setLoading(false)
    }
  }, [enabled, url, load])

  return {
    data,
    error,
    loading,
    refreshing,
    reload: (silent = true) => load(silent),
    setData,
  }
}
