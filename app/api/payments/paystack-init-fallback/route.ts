import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/lib/supabase-server"
import { getPaystackSecretKey } from "@/lib/config"
import { canPurchasePlan, getPlanBySlug, planOrderId, type PlanSlug } from "@/lib/plans"
import {
  buildBulkCoursePaymentReference,
  buildCoursePaymentReference,
  buildSubscriptionPaymentReference,
  parseCourseTitlesFromPayload,
} from "@/lib/paystack-reference"
import { validateCourseCheckoutAmount } from "@/lib/course-pricing"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

interface FallbackInitializeRequest {
  amount: number
  email: string
  reference: string
  name?: string
  courseId?: number | string
  courseIds?: Array<number | string>
  courseTitle?: string
  planSlug?: PlanSlug
  userId?: string
  metadata?: Record<string, unknown>
}

function parseCheckoutAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount) : 0
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`pay-init:${clientIpFromRequest(request)}`, 15, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  try {
    const body: FallbackInitializeRequest = await request.json()

    const serverSupabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized payment initialization" }, { status: 401 })
    }

    const amount = parseCheckoutAmount(body.amount)
    const email = String(body.email || user.email || "").trim()

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json(
        { error: "Missing email for checkout. Update your account email and try again." },
        { status: 400 },
      )
    }
    const isSubscription = Boolean(body.planSlug)
    let orderCourseId = ""
    let paymentReference = ""
    let paystackMetadata: Record<string, unknown> = {
      userId: user.id,
      ...(body.metadata || {}),
    }

    let writeClient = serverSupabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      writeClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      ) as unknown as typeof serverSupabase
    }

    if (isSubscription) {
      const { data: profile } = await serverSupabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const plan = getPlanBySlug(body.planSlug!)
      if (!plan) {
        return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
      }
      if (!canPurchasePlan(profile?.role || "student", body.planSlug!)) {
        return NextResponse.json(
          { error: "This plan is not available for your account type" },
          { status: 403 },
        )
      }
      if (!plan.purchasable || plan.price <= 0) {
        return NextResponse.json({ error: "This plan cannot be purchased" }, { status: 400 })
      }
      if (amount !== Math.round(plan.price)) {
        return NextResponse.json({ error: "Plan amount mismatch" }, { status: 400 })
      }
      orderCourseId = planOrderId(body.planSlug!)
      paymentReference = buildSubscriptionPaymentReference(plan.name)
      paystackMetadata = {
        ...paystackMetadata,
        type: "subscription",
        planSlug: body.planSlug,
        planName: plan.name,
        purchaseDescription: `Nexus ${plan.name} subscription`,
      }
    } else {
      const normalizedCourseIds = (body.courseIds?.length
        ? body.courseIds
        : body.courseId !== undefined
          ? [body.courseId]
          : []
      )
        .map((id) => String(id).trim())
        .filter(Boolean)

      if (normalizedCourseIds.length === 0) {
        return NextResponse.json(
          { error: "Missing courseId/courseIds or planSlug for checkout" },
          { status: 400 },
        )
      }

      orderCourseId = normalizedCourseIds.join(",")

      const priceCheck = await validateCourseCheckoutAmount(
        writeClient,
        normalizedCourseIds,
        amount,
      )
      if (!priceCheck.ok) {
        return NextResponse.json({ error: priceCheck.error }, { status: 400 })
      }

      const { data: courseRows } = await writeClient
        .from("courses")
        .select("id, title")
        .in("id", normalizedCourseIds)

      const titleById = new Map(
        (courseRows || []).map((row: { id: string; title: string }) => [row.id, row.title]),
      )
      const courseTitles = normalizedCourseIds
        .map((id) => titleById.get(id))
        .filter((title): title is string => Boolean(title?.trim()))

      const fallbackTitles = parseCourseTitlesFromPayload(body.courseTitle)
      const resolvedTitles = courseTitles.length > 0 ? courseTitles : fallbackTitles

      paymentReference =
        resolvedTitles.length <= 1
          ? buildCoursePaymentReference(resolvedTitles[0] || "Nexus Course")
          : buildBulkCoursePaymentReference(resolvedTitles)

      const purchaseDescription =
        resolvedTitles.length === 0
          ? "Nexus course purchase"
          : resolvedTitles.length === 1
            ? `Nexus course: ${resolvedTitles[0]}`
            : `Nexus courses: ${resolvedTitles.join(", ")}`

      paystackMetadata = {
        ...paystackMetadata,
        type: "course",
        courseId: body.courseId,
        courseIds: normalizedCourseIds,
        courseTitle: resolvedTitles.join(", ") || body.courseTitle,
        purchaseDescription,
      }
    }

    const { data: order, error: orderError } = await writeClient
      .from("orders")
      .insert({
        user_id: user.id,
        course_id: orderCourseId,
        reference: paymentReference,
        amount,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: "Failed to create pending order", details: orderError.message },
        { status: 500 },
      )
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getPaystackSecretKey()}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        email,
        reference: paymentReference,
        metadata: paystackMetadata,
        callback_url:
          process.env.PAYSTACK_CALLBACK_URL ||
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/verify`,
      }),
    })

    const data = await paystackResponse.json()

    if (!paystackResponse.ok) {
      await writeClient
        .from("orders")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("reference", paymentReference)
      return NextResponse.json(
        { error: "Paystack initialization failed", details: data },
        { status: paystackResponse.status },
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
      orderId: order?.id || null,
      paymentType: isSubscription ? "subscription" : "course",
    })
  } catch (error) {
    console.error("paystack-init-fallback error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    )
  }
}
