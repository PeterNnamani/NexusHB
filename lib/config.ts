/**
 * Centralized environment configuration.
 *
 * Server-only secrets are read lazily and throw a clear error when missing so
 * misconfiguration fails loudly instead of silently falling back to test keys.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your .env.local (see .env.local.example).`,
    )
  }
  return value
}

// Public (safe to expose to the browser)
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ""

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"

// Server-only secrets (never import these into client components)
export function getPaystackSecretKey(): string {
  return required("PAYSTACK_SECRET_KEY", process.env.PAYSTACK_SECRET_KEY)
}

export function getSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined
}

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined
}
