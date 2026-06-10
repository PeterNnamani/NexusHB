import { NextRequest, NextResponse } from "next/server"
import { isAssessmentTableMissing } from "@/lib/assessments"
import { createClient as createServerClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const courseId = new URL(request.url).searchParams.get("courseId")
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

  const { data, error } = await supabase
    .from("assessment_submissions")
    .select("ref_key, kind, lesson_id, body, submitted_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)

  if (error) {
    if (isAssessmentTableMissing(error)) {
      console.warn("[assessments GET] assessment_submissions table missing — run course_assessments_migration.sql")
      return NextResponse.json({ submissions: [], tableReady: false })
    }
    console.error("[assessments GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submissions: data || [], tableReady: true })
}
