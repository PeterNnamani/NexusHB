/**
 * Shared server-side payment init payload for courses and subscriptions.
 */

import type { PlanSlug } from "@/lib/plans"
import { normalizeCheckoutAmount } from "@/lib/checkout-client"

export interface InitPaymentBody {
  amount: number
  email: string
  name?: string
  /** Optional — server builds a descriptive reference for Paystack receipts. */
  reference?: string
  userId?: string
  courseIds?: string[]
  courseNames?: string
  planSlug?: PlanSlug
  metadata?: Record<string, unknown>
}

export interface InitPaymentResult {
  success: boolean
  authorizationUrl?: string
  reference?: string
  paymentType?: "course" | "subscription"
  error?: string
}

export async function initializePaystackPayment(
  body: InitPaymentBody,
): Promise<InitPaymentResult> {
  const amount = normalizeCheckoutAmount(body.amount)
  const email = String(body.email || "").trim()

  if (!email) {
    return { success: false, error: "A valid email is required for checkout" }
  }
  if (amount <= 0) {
    return { success: false, error: "Payment amount must be greater than zero" }
  }

  const payload: Record<string, unknown> = {
    amount,
    email,
  }

  if (body.reference?.trim()) {
    payload.reference = body.reference.trim()
  }

  if (body.name) payload.name = body.name
  if (body.userId) payload.userId = body.userId
  if (body.metadata) payload.metadata = body.metadata

  if (body.planSlug) {
    payload.planSlug = body.planSlug
  } else if (body.courseIds?.length) {
    payload.courseIds = body.courseIds.map((id) => String(id))
    if (body.courseNames) payload.courseTitle = body.courseNames
  }

  const res = await fetch("/api/payments/paystack-init-fallback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.error || "Payment initialization failed" }
  }

  return {
    success: true,
    authorizationUrl: data.authorizationUrl,
    reference: data.reference,
    paymentType: data.paymentType,
  }
}
