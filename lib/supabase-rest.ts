import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config"

const FETCH_TIMEOUT_MS = 8000
let warnedUnreachable = false

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL?.trim() && SUPABASE_ANON_KEY?.trim())
}

const fetchWithTimeout: typeof fetch = (input, init) => {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  return fetch(input, { ...init, signal })
}

/** Server-side anon client for public/RLS-backed reads. Fails faster when Supabase is unreachable. */
export function createRestClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  })
}

function formatSupabaseError(error: unknown): string {
  if (error == null) return "unknown error"
  if (typeof error === "object" && Object.keys(error as object).length === 0) {
    return "fetch failed"
  }
  if (typeof error === "object") {
    const e = error as { message?: string; details?: string; code?: string; hint?: string }
    return [e.message, e.details, e.code, e.hint].filter(Boolean).join(" ")
  }
  return String(error)
}

/**
 * Log connection issues once (server terminal only). Avoids console.error so Next.js
 * dev does not surface empty `{}` errors in the browser overlay.
 */
export function logSupabaseConnectionError(context: string, error: unknown) {
  const message = formatSupabaseError(error)
  const isConnectionFailure = /ENOTFOUND|fetch failed|getaddrinfo|timeout|aborted|ECONNREFUSED/i.test(
    message,
  )

  if (isConnectionFailure) {
    if (!warnedUnreachable) {
      warnedUnreachable = true
      let host = "(missing URL)"
      try {
        if (SUPABASE_URL) host = new URL(SUPABASE_URL).hostname
      } catch {
        host = SUPABASE_URL
      }
      console.warn(
        `[Nexus] Cannot reach Supabase (${host}). Update NEXT_PUBLIC_SUPABASE_URL and keys in .env.local — see .env.local.example.`,
      )
    }
    return
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[Nexus] ${context}: ${message}`)
  }
}
