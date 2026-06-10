export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms: ${url}`)
    this.name = "FetchTimeoutError"
  }
}

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number
}

/** JSON fetch with timeout — always rejects on failure instead of hanging. */
export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { timeoutMs = 12_000, ...init } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: init.cache ?? "no-store",
    })

    const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string }

    if (!res.ok) {
      const msg =
        (data as { error?: string; message?: string }).error ||
        (data as { error?: string; message?: string }).message ||
        `Request failed (${res.status})`
      throw new Error(msg)
    }

    return data
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchTimeoutError(url, timeoutMs)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
