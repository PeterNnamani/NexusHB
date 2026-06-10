import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import {
  assessmentTableMissingMessage,
  buildRefKey,
  isAssessmentTableMissing,
  normalizeSubmissionBody,
  type AssessmentKind,
} from "@/lib/assessments"

export const dynamic = "force-dynamic"

async function isEnrolled(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  courseId: string,
) {
  const { data } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle()
  return !!data
}

/** Project unlocks once the student has opened the final curriculum topic. */
async function hasReachedLastTopic(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  courseId: string,
) {
  const { data: lastLesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastLesson) return false

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("lesson_id", lastLesson.id)
    .maybeSingle()

  return !!progress
}

export async function POST(request: NextRequest) {
  let body: {
    courseId?: string
    lessonId?: string | null
    kind?: AssessmentKind
    payload?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const courseId = body.courseId?.trim()
  const kind = body.kind
  if (!courseId || !kind || !["quiz", "assignment", "project"].includes(kind)) {
    return NextResponse.json({ error: "courseId and valid kind are required" }, { status: 400 })
  }

  const normalized = normalizeSubmissionBody(kind, body.payload)
  if (!normalized) {
    return NextResponse.json({ error: "Invalid submission format" }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isEnrolled(supabase, user.id, courseId))) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 })
  }

  const lessonId = kind === "project" ? null : body.lessonId?.trim()
  if (kind !== "project" && !lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 })
  }

  if (kind === "project") {
    const unlocked = await hasReachedLastTopic(supabase, user.id, courseId)
    if (!unlocked) {
      return NextResponse.json(
        { error: "Open the final topic in the curriculum before submitting your project" },
        { status: 403 },
      )
    }
  }

  const refKey = buildRefKey(kind, courseId, lessonId)

  const { data, error } = await supabase
    .from("assessment_submissions")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        kind,
        ref_key: refKey,
        body: normalized,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,ref_key" },
    )
    .select("ref_key, kind, body, submitted_at")
    .single()

  if (error) {
    if (isAssessmentTableMissing(error)) {
      console.warn("[assessments submit] assessment_submissions table missing")
      return NextResponse.json(
        { error: assessmentTableMissingMessage() },
        { status: 503 },
      )
    }
    console.error("[assessments submit]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, submission: data })
}
