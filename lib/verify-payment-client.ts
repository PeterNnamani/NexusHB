"use client"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 25_000,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export interface VerifyPaymentResult {
  success: boolean
  message?: string
  planSlug?: string
  type?: "course" | "subscription"
  courseIds?: string[]
}

/**
 * Paystack can return "pending" for a moment after the inline modal reports success.
 * Retry verification, then reconcile subscription orders as a last resort.
 */
export async function verifyPaymentWithRetry(
  reference: string,
  options?: { isSubscription?: boolean; maxAttempts?: number },
): Promise<VerifyPaymentResult> {
  const maxAttempts = options?.maxAttempts ?? 4
  let lastMessage = "Payment verification failed"

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `/api/verify-payment?reference=${encodeURIComponent(reference)}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      )
      const data = (await res.json().catch(() => ({}))) as VerifyPaymentResult & {
        message?: string
      }

      if (res.ok && data.success) {
        return data
      }

      lastMessage = data.message || lastMessage
    } catch (err) {
      lastMessage =
        err instanceof Error && err.name === "AbortError"
          ? "Payment verification timed out"
          : "Could not reach payment verification"
    }

    if (attempt < maxAttempts - 1) {
      await sleep(500 + attempt * 600)
    }
  }

  if (options?.isSubscription) {
    const reconcileRes = await fetch("/api/subscriptions/reconcile", {
      method: "POST",
      cache: "no-store",
      credentials: "include",
    })
    const reconcileData = (await reconcileRes.json().catch(() => ({}))) as {
      success?: boolean
      message?: string
      error?: string
      effectivePlanSlug?: string
    }

    if (reconcileRes.ok && reconcileData.success) {
      return {
        success: true,
        message: reconcileData.message || "Subscription activated",
        planSlug: reconcileData.effectivePlanSlug,
        type: "subscription",
      }
    }

    if (reconcileData.message || reconcileData.error) {
      lastMessage = reconcileData.message || reconcileData.error || lastMessage
    }
  }

  throw new Error(lastMessage)
}
