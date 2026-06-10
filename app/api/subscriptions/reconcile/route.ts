import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getPaystackSecretKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { parsePlanSlugFromOrderId } from "@/lib/plans"
import { fulfillSubscriptionOrder } from "@/lib/subscription-fulfillment"
import { getSubscriptionSummary } from "@/lib/subscription-db"
import { verifyAndFulfill } from "@/lib/payment-fulfillment"

export const dynamic = "force-dynamic"

/** Re-activate subscription from an already-paid order (e.g. if fulfillment failed earlier). */
export async function POST() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const existing = await getSubscriptionSummary(user.id, profile?.role, supabase)
  if (existing.isPaid) {
    return NextResponse.json({
      success: true,
      message: "Subscription already active",
      subscription: existing.subscription,
    })
  }

  const { data: orders } = await admin
    .from("orders")
    .select("reference, course_id, amount, status")
    .eq("user_id", user.id)
    .like("course_id", "plan:%")
    .in("status", ["paid", "pending"])
    .order("created_at", { ascending: false })
    .limit(5)

  const planOrders = (orders || []).filter((o) =>
    parsePlanSlugFromOrderId(String(o.course_id)),
  )

  if (planOrders.length === 0) {
    return NextResponse.json(
      { error: "No subscription order found to reconcile" },
      { status: 404 },
    )
  }

  let fulfilled = false
  let lastMessage = ""

  for (const order of planOrders) {
    if (order.status === "paid") {
      const result = await fulfillSubscriptionOrder(
        order.reference,
        user.id,
        String(order.course_id),
        Number(order.amount) || 0,
      )
      lastMessage = result.message
      if (result.success) {
        fulfilled = true
        break
      }
      continue
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${order.reference}`,
      {
        headers: { Authorization: `Bearer ${getPaystackSecretKey()}` },
      },
    )
    const paystackData = await paystackRes.json()
    if (paystackRes.ok && paystackData?.data?.status === "success") {
      const verify = await verifyAndFulfill(order.reference, { expectedUserId: user.id })
      lastMessage = verify.message
      if (verify.success) {
        fulfilled = true
        break
      }
    }
  }

  if (!fulfilled) {
    return NextResponse.json(
      { error: lastMessage || "Could not activate subscription from existing orders" },
      { status: 500 },
    )
  }

  const summary = await getSubscriptionSummary(user.id, profile?.role, supabase)

  return NextResponse.json({
    success: true,
    message: lastMessage,
    subscription: summary.subscription,
    effectivePlanSlug: summary.effectivePlanSlug,
    effectivePlanName: summary.effectivePlanName,
  })
}
