import { NextResponse } from "next/server"
import { requireStaff, getAdminDb } from "@/lib/admin-auth"
import { isAdminRole } from "@/lib/admin"
import { resolveOwnedInstructorIds } from "@/lib/instructor-identity"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireStaff()
  if ("error" in auth) return auth.error

  try {
    const admin = getAdminDb()
    let courseQuery = admin.from("courses").select("id, title, status, students_count")
    if (!isAdminRole(auth.profile.role)) {
      const ownedIds = await resolveOwnedInstructorIds(admin, {
        kind: "staff",
        profile: auth.profile,
      })
      courseQuery = courseQuery.in("instructor_id", ownedIds)
    }

    const { data: courses, error: courseError } = await courseQuery
    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 })
    }

    const courseIds = (courses || []).map((c) => c.id)
    if (courseIds.length === 0) {
      return NextResponse.json({ students: [], courses: courses || [], total: 0 })
    }

    const { data: enrollments, error: enrollError } = await admin
      .from("enrollments")
      .select("user_id, course_id, progress, status, enrolled_at")
      .in("course_id", courseIds)
      .eq("status", "active")

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    const userIds = [...new Set((enrollments || []).map((e) => e.user_id))]
    const { data: users } = await admin
      .from("users")
      .select("id, name, email, avatar, created_at")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])

    const userMap = new Map(
      (users || []).map((u) => [
        u.id,
        {
          name: u.name || u.email?.split("@")[0] || "Student",
          email: u.email,
          avatar: u.avatar,
          joinedAt: u.created_at,
        },
      ]),
    )

    const courseTitleMap = new Map((courses || []).map((c) => [c.id, c.title]))

    const studentMap = new Map<
      string,
      {
        id: string
        name: string
        email: string
        avatar: string | null
        joinedAt: string | null
        courses: { courseId: string; title: string; progress: number; enrolledAt: string | null }[]
      }
    >()

    for (const e of enrollments || []) {
      const user = userMap.get(e.user_id)
      if (!user) continue

      const existing = studentMap.get(e.user_id) || {
        id: e.user_id,
        name: user.name,
        email: user.email || "",
        avatar: user.avatar,
        joinedAt: user.joinedAt,
        courses: [] as {
          courseId: string
          title: string
          progress: number
          enrolledAt: string | null
        }[],
      }

      existing.courses.push({
        courseId: e.course_id,
        title: courseTitleMap.get(e.course_id) || "Course",
        progress: Number(e.progress) || 0,
        enrolledAt: e.enrolled_at,
      })
      studentMap.set(e.user_id, existing)
    }

    const students = [...studentMap.values()].sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      students,
      courses: courses || [],
      total: students.length,
    })
  } catch (error) {
    console.error("tutor students error:", error)
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 })
  }
}
