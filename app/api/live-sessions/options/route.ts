import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { createLiveSessionAdminClient } from "@/lib/livekit"
import { userCanHostLiveClassroom } from "@/lib/subscription-db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createLiveSessionAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!["admin", "tutor"].includes(profile?.role || "") ||
      !(await userCanHostLiveClassroom(user.id, profile?.role, supabase))) {
    return NextResponse.json({ error: "Live Classroom hosting is not enabled for this account" }, { status: 403 })
  }

  const courseId = new URL(request.url).searchParams.get("courseId")
  let coursesQuery = admin.from("courses").select("id, title, instructor_id").order("title")
  if (profile?.role !== "admin") coursesQuery = coursesQuery.eq("instructor_id", user.id)
  const { data: courses, error: coursesError } = await coursesQuery
  if (coursesError) return NextResponse.json({ error: coursesError.message }, { status: 500 })

  if (!courseId) return NextResponse.json({ courses: courses || [], lessons: [] })
  if (!courses?.some((course) => course.id === courseId)) {
    return NextResponse.json({ error: "You cannot schedule a class for this course" }, { status: 403 })
  }

  const { data: lessons, error: lessonsError } = await admin
    .from("lessons")
    .select("id, title, position")
    .eq("course_id", courseId)
    .order("position")
  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 })
  return NextResponse.json({ courses: courses || [], lessons: lessons || [] })
}
