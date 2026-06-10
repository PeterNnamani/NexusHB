import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("live_sessions")
    .select("id, host_id, course_id, title, scheduled_at, duration_minutes, status, created_at")
    .order("scheduled_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const hostIds = [...new Set((data || []).map((s) => s.host_id))]
  const courseIds = [...new Set((data || []).map((s) => s.course_id).filter(Boolean))]

  const [{ data: hosts }, { data: courses }] = await Promise.all([
    admin.from("users").select("id, name, email").in("id", hostIds.length ? hostIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("courses").select("id, title").in("id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ])

  const hostMap = new Map((hosts || []).map((u) => [u.id, u.name || u.email?.split("@")[0] || "Host"]))
  const courseMap = new Map((courses || []).map((c) => [c.id, c.title]))

  return NextResponse.json({
    items: (data || []).map((s) => ({
      id: s.id,
      title: s.title,
      host: hostMap.get(s.host_id) || "Unknown",
      course: s.course_id ? courseMap.get(s.course_id) || "—" : "—",
      scheduledAt: s.scheduled_at,
      duration: s.duration_minutes,
      status: s.status,
      createdAt: s.created_at,
    })),
  })
}
