import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("certificates")
    .select("id, user_id, course_id, certificate_no, issued_at")
    .order("issued_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((c) => c.user_id))]
  const courseIds = [...new Set((data || []).map((c) => c.course_id))]

  const [{ data: users }, { data: courses }] = await Promise.all([
    admin.from("users").select("id, name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("courses").select("id, title").in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const userMap = new Map((users || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "User"]))
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return NextResponse.json({
    items: (data || []).map((c) => ({
      id: c.id,
      student: userMap.get(c.user_id) || "Unknown",
      course: courseMap.get(c.course_id) || "Course",
      number: c.certificate_no,
      issuedAt: c.issued_at,
    })),
  })
}
