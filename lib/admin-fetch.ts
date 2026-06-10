"use client"

type CacheEntry<T> = { value: T; expiresAt: number; promise?: Promise<T> }

const clientStore = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 30_000

/** Cached admin fetch — dedupes in-flight requests and reuses data for 30s. */
export async function adminFetch<T>(
  url: string,
  options: RequestInit & { ttlMs?: number } = {},
): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, ...init } = options
  const key = `${url}:${init.method || "GET"}`
  const now = Date.now()
  const noCache = ttlMs <= 0
  const hit = noCache ? undefined : clientStore.get(key)

  if (hit && hit.expiresAt > now && !hit.promise) {
    return hit.value as T
  }

  if (hit?.promise) {
    return hit.promise as Promise<T>
  }

  const promise = fetch(url, {
    ...init,
    credentials: init.credentials ?? "include",
    cache: "no-store",
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
      }
      if (!noCache) {
        clientStore.set(key, { value: data, expiresAt: Date.now() + ttlMs })
      }
      return data as T
    })
    .catch((err) => {
      clientStore.delete(key)
      throw err
    })

  clientStore.set(key, {
    value: hit?.value,
    expiresAt: hit?.expiresAt ?? 0,
    promise,
  })

  return promise
}

export function invalidateAdminFetch(urlPrefix: string) {
  for (const key of clientStore.keys()) {
    if (key.startsWith(urlPrefix)) clientStore.delete(key)
  }
}
