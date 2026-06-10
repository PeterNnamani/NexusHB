import { supabase } from "@/lib/supabase"

/** Prefer context email; fall back to the live Supabase auth session. */
export async function resolveCheckoutEmail(contextEmail?: string): Promise<string> {
  const fromContext = String(contextEmail || "").trim()
  if (fromContext) return fromContext

  const { data } = await supabase.auth.getUser()
  return String(data.user?.email || "").trim()
}

export function normalizeCheckoutAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount) : 0
}

export function assertCheckoutReady(amount: number, email: string): string | null {
  if (!email) {
    return "Your account needs an email address before checkout. Sign out and sign in again, or update your profile."
  }
  if (amount <= 0) {
    return "Cart total must be greater than zero. Remove free items or refresh the page and try again."
  }
  return null
}
