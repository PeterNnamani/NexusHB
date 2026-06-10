type CacheEntry<T> = { value: T; expiresAt: number }

const store = new Map<string, CacheEntry<unknown>>()

/** Short-lived in-memory cache for hot API routes (per server instance). */
export async function withServerCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T
  }

  const value = await loader()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

export function invalidateServerCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

export const ADMIN_CACHE_TTL_MS = 30_000
export const PUBLIC_CACHE_TTL_MS = 60_000
