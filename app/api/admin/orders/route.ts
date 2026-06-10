import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"
import { roundMoney } from "@/lib/finance"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("orders")
    .select("id, user_id, course_id, reference, amount, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((o) => o.user_id))]
  const { data: users } = await admin.from("users").select("id, name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
  const userMap = new Map((users || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "User"]))

  const courseIds = [...new Set((data || []).map((o) => o.course_id).filter((id): id is string => !!id && !id.startsWith("plan:")))]
  const { data: courses } = await admin.from("courses").select("id, title").in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"])
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return NextResponse.json({
    items: (data || []).map((o) => ({
      id: o.id,
      reference: o.reference,
      buyer: userMap.get(o.user_id) || "Unknown",
      item: o.course_id?.startsWith("plan:")
        ? o.course_id.replace("plan:", "").replace(/_/g, " ")
        : courseMap.get(o.course_id) || o.course_id,
      amount: roundMoney(Number(o.amount) || 0),
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    })),
  })
}
