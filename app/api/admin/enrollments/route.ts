import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("enrollments")
    .select("id, user_id, course_id, status, progress, enrolled_at, completed_at")
    .order("enrolled_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((e) => e.user_id))]
  const courseIds = [...new Set((data || []).map((e) => e.course_id))]

  const [{ data: users }, { data: courses }] = await Promise.all([
    admin.from("users").select("id, name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("courses").select("id, title").in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const userMap = new Map((users || []).map((u) => [u.id, { name: u.name || u.email?.split("@")[0], email: u.email }]))
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return NextResponse.json({
    items: (data || []).map((e) => {
      const u = userMap.get(e.user_id)
      return {
        id: e.id,
        student: u?.name || "Student",
        email: u?.email || "",
        course: courseMap.get(e.course_id) || "Course",
        status: e.status,
        progress: Number(e.progress) || 0,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      }
    }),
  })
}
