import type { SupabaseClient } from "@supabase/supabase-js"

export function roundPrice(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount) : 0
}

/**
 * Validates that a checkout amount matches the sum of published course prices.
 */
export async function validateCourseCheckoutAmount(
  db: SupabaseClient,
  courseIds: string[],
  amount: number,
): Promise<{ ok: true; expected: number } | { ok: false; expected: number; error: string }> {
  const uniqueIds = [...new Set(courseIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    return { ok: false, expected: 0, error: "No courses selected" }
  }

  const { data: rows, error } = await db
    .from("courses")
    .select("id, price, status")
    .in("id", uniqueIds)

  if (error) {
    return { ok: false, expected: 0, error: "Could not verify course prices" }
  }

  if (!rows || rows.length !== uniqueIds.length) {
    return { ok: false, expected: 0, error: "One or more courses were not found" }
  }

  const unpublished = rows.filter((r) => r.status !== "published")
  if (unpublished.length > 0) {
    return { ok: false, expected: 0, error: "One or more courses are not available for purchase" }
  }

  const expected = rows.reduce((sum, row) => sum + roundPrice(row.price), 0)
  const rounded = roundPrice(amount)

  if (rounded !== expected) {
    return {
      ok: false,
      expected,
      error: `Checkout amount does not match course price (expected ₦${expected.toLocaleString()})`,
    }
  }

  return { ok: true, expected }
}

/** Paystack amounts are in kobo (minor units). */
export function paystackPaidNaira(txData: Record<string, unknown>): number {
  return roundPrice(Number(txData.amount || 0) / 100)
}
