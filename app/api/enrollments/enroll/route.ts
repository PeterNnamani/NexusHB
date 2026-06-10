import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { roundPrice } from "@/lib/course-pricing"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`enroll:${clientIpFromRequest(request)}`, 20, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  let body: { courseId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const courseId = body.courseId?.trim()
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, price, status")
    .eq("id", courseId)
    .maybeSingle()

  if (courseError || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  if (course.status !== "published") {
    return NextResponse.json({ error: "Course is not available" }, { status: 403 })
  }

  const price = roundPrice(course.price)

  const { data: existing } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, alreadyEnrolled: true })
  }

  if (price > 0) {
    return NextResponse.json(
      { error: "This course requires payment before enrollment" },
      { status: 403 },
    )
  }

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })

  const { error: enrollError } = await admin.from("enrollments").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      status: "active",
      progress: 0,
      enrolled_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  )

  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }

  const { data: profile } = await admin
    .from("users")
    .select("enrolled_courses")
    .eq("id", user.id)
    .maybeSingle()

  if (profile) {
    const existingCourses = Array.isArray(profile.enrolled_courses)
      ? profile.enrolled_courses.map(String)
      : []
    const merged = Array.from(new Set([...existingCourses, courseId]))
    await admin.from("users").update({ enrolled_courses: merged }).eq("id", user.id)
  }

  return NextResponse.json({ success: true, alreadyEnrolled: false })
}
