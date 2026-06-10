import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"
import { roundMoney } from "@/lib/finance"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("payments")
    .select("id, user_id, course_id, amount, reference, status, payment_method, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((p) => p.user_id))]
  const courseIds = [
    ...new Set(
      (data || [])
        .map((p) => p.course_id)
        .filter((id): id is string => !!id && !id.startsWith("plan:")),
    ),
  ]

  const [{ data: users }, { data: courses }] = await Promise.all([
    admin
      .from("users")
      .select("id, name, email")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("courses")
      .select("id, title")
      .in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const userMap = new Map((users || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "User"]))
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return NextResponse.json({
    items: (data || []).map((p) => ({
      id: p.id,
      reference: p.reference,
      payer: userMap.get(p.user_id) || "Unknown",
      item: p.course_id?.startsWith("plan:")
        ? p.course_id.replace("plan:", "").replace(/_/g, " ")
        : courseMap.get(p.course_id) || "Subscription",
      amount: roundMoney(Number(p.amount) || 0),
      status: p.status,
      method: p.payment_method || "paystack",
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
  })
}
