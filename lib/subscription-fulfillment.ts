import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { getPlanBySlug, parsePlanSlugFromOrderId, type PlanSlug } from "@/lib/plans"

const BILLING_PERIOD_DAYS = 30

export async function fulfillSubscriptionOrder(
  reference: string,
  userId: string,
  orderCourseId: string,
  amount: number,
): Promise<{ success: boolean; message: string; planSlug?: PlanSlug }> {
  const planSlug = parsePlanSlugFromOrderId(orderCourseId)
  if (!planSlug) {
    return { success: false, message: "Invalid subscription plan on order" }
  }

  const plan = getPlanBySlug(planSlug)
  if (!plan) {
    return { success: false, message: "Unknown subscription plan" }
  }

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })

  const { data: planRow } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("slug", planSlug)
    .maybeSingle()

  if (!planRow?.id) {
    return { success: false, message: "Plan not configured in database. Run database_setup.sql." }
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + BILLING_PERIOD_DAYS)

  await admin
    .from("user_subscriptions")
    .update({ status: "cancelled", updated_at: now.toISOString() })
    .eq("user_id", userId)
    .eq("status", "active")

  const { error: subError } = await admin.from("user_subscriptions").insert({
    user_id: userId,
    plan_id: planRow.id,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    paystack_reference: reference,
  })

  if (subError) {
    return { success: false, message: subError.message }
  }

  if (plan.roleUpgrade) {
    await admin.from("users").update({ role: plan.roleUpgrade }).eq("id", userId)
  }

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .maybeSingle()

  if (!existingPayment) {
    await admin.from("payments").insert({
      user_id: userId,
      course_id: null,
      amount,
      reference,
      status: "success",
      payment_method: "paystack",
      paid_at: now.toISOString(),
    })
  }

  return {
    success: true,
    message: `${plan.name} plan activated until ${periodEnd.toLocaleDateString()}`,
    planSlug,
  }
}
