import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("user_subscriptions")
    .select("id, user_id, plan_id, status, current_period_start, current_period_end, paystack_reference, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((s) => s.user_id))]
  const planIds = [...new Set((data || []).map((s) => s.plan_id))]

  const [{ data: users }, { data: plans }] = await Promise.all([
    admin.from("users").select("id, name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("subscription_plans").select("id, name, slug, price").in("id", planIds.length ? planIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const userMap = new Map((users || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "User"]))
  const planMap = new Map((plans || []).map((p) => [p.id, { name: p.name, slug: p.slug, price: Number(p.price) || 0 }]))

  return NextResponse.json({
    items: (data || []).map((s) => {
      const plan = planMap.get(s.plan_id)
      return {
        id: s.id,
        user: userMap.get(s.user_id) || "Unknown",
        plan: plan?.name || "Plan",
        slug: plan?.slug || "",
        price: plan?.price ?? 0,
        status: s.status,
        periodStart: s.current_period_start,
        periodEnd: s.current_period_end,
        reference: s.paystack_reference,
        createdAt: s.created_at,
      }
    }),
  })
}
