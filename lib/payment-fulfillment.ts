import { createClient } from "@supabase/supabase-js"
import { getPaystackSecretKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import {
  parsePlanSlugFromOrderId,
  planOrderId,
  getPlanBySlug,
  type PlanSlug,
} from "@/lib/plans"
import { fulfillSubscriptionOrder } from "@/lib/subscription-fulfillment"
import { paystackPaidNaira, roundPrice } from "@/lib/course-pricing"

interface FulfillResult {
  success: boolean
  message: string
  courseIds?: string[]
  planSlug?: string
  type?: "course" | "subscription"
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function verifyPaystackTransaction(reference: string): Promise<{
  ok: boolean
  data: Record<string, unknown> | null
  status?: string
  message: string
}> {
  const secretKey = getPaystackSecretKey()
  const maxAttempts = 5

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    const paystackData = await paystackResponse.json()
    const txData = (paystackData?.data || {}) as Record<string, unknown>
    const status = String(txData.status || "")

    if (paystackResponse.ok && status === "success") {
      return { ok: true, data: txData, status, message: "Payment verified" }
    }

    if (status === "failed" || status === "abandoned" || status === "reversed") {
      return {
        ok: false,
        data: txData,
        status,
        message: `Payment ${status}. Please try again.`,
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(500 + attempt * 600)
    } else {
      return {
        ok: false,
        data: txData,
        status: status || "unknown",
        message:
          status === "pending"
            ? "Payment is still processing. Wait a moment and tap Refresh plan status."
            : "Payment verification failed",
      }
    }
  }

  return { ok: false, data: null, message: "Payment verification failed" }
}

function extractCourseIdsFromMetadata(metadata: any): string[] {
  if (!metadata) return []
  if (Array.isArray(metadata.courseIds)) {
    return metadata.courseIds.map((v: unknown) => String(v).trim()).filter(Boolean)
  }
  if (typeof metadata.courseIds === "string") {
    return metadata.courseIds.split(",").map((v: string) => v.trim()).filter(Boolean)
  }
  if (metadata.courseId !== undefined && metadata.courseId !== null) {
    const value = String(metadata.courseId).trim()
    return value ? [value] : []
  }
  return []
}

/**
 * Verifies a Paystack transaction and fulfills the order: marks it paid,
 * enrolls the user in each (UUID) course, records the payment, and updates the
 * user's enrolled_courses projection. Idempotent and safe to call from both the
 * client-driven verify endpoint and the Paystack webhook.
 */
function amountsMatch(orderAmount: number, paidNaira: number): boolean {
  return roundPrice(orderAmount) === roundPrice(paidNaira)
}

export async function verifyAndFulfill(
  reference: string,
  options?: { expectedUserId?: string },
): Promise<FulfillResult> {
  if (!reference) return { success: false, message: "Reference is required" }

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

  const { data: existingOrder } = await admin
    .from("orders")
    .select("id, user_id, course_id, amount, status, reference")
    .eq("reference", reference)
    .maybeSingle()

  if (options?.expectedUserId && existingOrder && existingOrder.user_id !== options.expectedUserId) {
    return { success: false, message: "This payment does not belong to your account" }
  }

  if (existingOrder?.status === "paid") {
    const planSlug = parsePlanSlugFromOrderId(String(existingOrder.course_id))
    if (planSlug) {
      const { data: activeSub } = await admin
        .from("user_subscriptions")
        .select("id, subscription_plans(slug, name)")
        .eq("user_id", existingOrder.user_id)
        .eq("status", "active")
        .eq("paystack_reference", reference)
        .maybeSingle()

      if (activeSub) {
        const rawPlan = activeSub.subscription_plans
        const plan = (Array.isArray(rawPlan) ? rawPlan[0] : rawPlan) as { name?: string } | null
        return {
          success: true,
          message: `${plan?.name || "Subscription"} plan is already active`,
          planSlug,
          type: "subscription",
        }
      }

      const subResult = await fulfillSubscriptionOrder(
        reference,
        existingOrder.user_id,
        String(existingOrder.course_id),
        Number(existingOrder.amount) || 0,
      )
      return {
        success: subResult.success,
        message: subResult.message,
        planSlug: subResult.planSlug,
        type: "subscription",
      }
    }

    return {
      success: true,
      message: "Payment already confirmed",
      type: "course",
    }
  }

  const paystack = await verifyPaystackTransaction(reference)
  if (!paystack.ok || !paystack.data) {
    return { success: false, message: paystack.message }
  }

  const txData = paystack.data
  const paidNaira = paystackPaidNaira(txData)
  const metadata = (txData.metadata || {}) as Record<string, unknown>

  let order = existingOrder

  if (options?.expectedUserId && order && order.user_id !== options.expectedUserId) {
    return { success: false, message: "This payment does not belong to your account" }
  }

  if (!order) {
    const metaUserId = metadata?.userId ? String(metadata.userId) : null
    const metaPlanSlug =
      metadata?.type === "subscription" && metadata?.planSlug
        ? String(metadata.planSlug)
        : null
    const metaCourseIds = extractCourseIdsFromMetadata(metadata)

    let fallbackCourseId = ""
    if (metaPlanSlug && getPlanBySlug(metaPlanSlug)) {
      fallbackCourseId = planOrderId(metaPlanSlug as PlanSlug)
    } else if (metaCourseIds.length > 0) {
      fallbackCourseId = metaCourseIds.join(",")
    }

    if (!metaUserId || !fallbackCourseId) {
      return { success: false, message: "Order not found and metadata insufficient" }
    }

    const { data: inserted } = await admin
      .from("orders")
      .insert({
        user_id: metaUserId,
        course_id: fallbackCourseId,
        reference,
        amount: Number(txData.amount || 0) / 100,
        status: "paid",
      })
      .select("id, user_id, course_id, amount, status, reference")
      .maybeSingle()
    order = inserted || {
      id: null,
      user_id: metaUserId,
      course_id: fallbackCourseId,
      amount: paidNaira,
      status: "paid",
      reference,
    }
  }

  if (!amountsMatch(Number(order.amount) || 0, paidNaira)) {
    return {
      success: false,
      message: "Payment amount does not match the order total",
    }
  }

  if (!order.course_id) {
    return { success: false, message: "Order missing course_id" }
  }

  const planSlug = parsePlanSlugFromOrderId(String(order.course_id))
  if (planSlug) {
    await admin
      .from("orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("reference", reference)

    const subResult = await fulfillSubscriptionOrder(
      reference,
      order.user_id,
      String(order.course_id),
      Number(order.amount) || 0,
    )

    return {
      success: subResult.success,
      message: subResult.message,
      planSlug: subResult.planSlug,
      type: "subscription",
    }
  }

  const courseIds = String(order.course_id)
    .split(",")
    .map((c: string) => c.trim())
    .filter(Boolean)

  await admin
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("reference", reference)

  for (const courseId of courseIds) {
    await admin.from("enrollments").upsert(
      {
        user_id: order.user_id,
        course_id: courseId,
        status: "active",
        progress: 0,
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" },
    )
  }

  // Record a single payment row for the order (accurate spend history)
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .maybeSingle()

  if (!existingPayment) {
    await admin.from("payments").insert({
      user_id: order.user_id,
      course_id: courseIds.length === 1 ? courseIds[0] : null,
      amount: order.amount,
      reference,
      status: "success",
      payment_method: "paystack",
      paid_at: new Date().toISOString(),
    })
  }

  const { data: profileRow } = await admin
    .from("users")
    .select("enrolled_courses")
    .eq("id", order.user_id)
    .maybeSingle()

  if (profileRow) {
    const existing = Array.isArray(profileRow.enrolled_courses) ? profileRow.enrolled_courses : []
    const merged = Array.from(new Set([...existing.map(String), ...courseIds]))
    await admin.from("users").update({ enrolled_courses: merged }).eq("id", order.user_id)
  }

  return { success: true, message: "Payment confirmed and courses enrolled", courseIds, type: "course" }
}
