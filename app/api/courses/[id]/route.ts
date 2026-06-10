import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { userCanAccessFullCourseContent } from "@/lib/course-access"
import { resolveCourseForRequest } from "@/lib/course-content-server"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const { data: courseMeta } = await supabase
      .from("courses")
      .select("id, instructor_id")
      .eq(isUuid ? "id" : "slug", id)
      .maybeSingle()

    if (!courseMeta) {
      return NextResponse.json({ course: null, message: "Course not found" }, { status: 404 })
    }

    const canAccessFull = await userCanAccessFullCourseContent(supabase, user, {
      id: courseMeta.id,
      instructorId: courseMeta.instructor_id,
    })

    const resolved = await resolveCourseForRequest(supabase, id, canAccessFull)
    if (!resolved) {
      return NextResponse.json({ course: null, message: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({
      course: resolved.course,
      access: resolved.access,
    })
  } catch (error) {
    console.error("Failed to load course:", error)
    return NextResponse.json({ course: null, message: "Internal error" }, { status: 500 })
  }
}
