import { NextRequest, NextResponse } from "next/server"
import { requireContentAuth, getAdminDb } from "@/lib/admin-auth"
import {
  insertLessons,
  isLessonAssessmentColumnError,
  lessonInsertErrorMessage,
  LESSON_IMPORT_SELECT,
  selectLessonsForCourse,
  stripLessonAssessmentFields,
} from "@/lib/lesson-db"

export const dynamic = "force-dynamic"

function parseTopics(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export async function GET(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const courseId = new URL(request.url).searchParams.get("courseId")
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { data, error } = await selectLessonsForCourse(admin, courseId, LESSON_IMPORT_SELECT)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lessons: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: {
    courseId?: string
    title?: string
    week?: number | string
    video_url?: string
    video_title?: string
    duration?: string
    position?: number
    topics?: string[] | string
    quiz_title?: string
    quiz_num_questions?: number | string
    quiz_description?: string
    assignment_title?: string
    assignment_description?: string
    assignment_format?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.courseId || !body.title?.trim()) {
    return NextResponse.json({ error: "courseId and title are required" }, { status: 400 })
  }

  const admin = getAdminDb()

  const { count } = await admin
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("course_id", body.courseId)

  const position = body.position ?? (count ?? 0) + 1

  const { data: rows, error } = await insertLessons(admin, [
    {
      course_id: body.courseId,
      title: body.title.trim(),
      week: body.week ? Number(body.week) : position,
      position,
      video_url: body.video_url?.trim() || null,
      video_title: body.video_title?.trim() || body.title.trim(),
      duration: body.duration?.trim() || null,
      topics: parseTopics(body.topics),
      quiz_title: body.quiz_title?.trim() || null,
      quiz_num_questions: body.quiz_num_questions
        ? Number(body.quiz_num_questions)
        : null,
      quiz_description: body.quiz_description?.trim() || null,
      assignment_title: body.assignment_title?.trim() || null,
      assignment_description: body.assignment_description?.trim() || null,
      assignment_format: body.assignment_format?.trim() || null,
    },
  ])

  if (error || !rows?.[0]) {
    return NextResponse.json(
      { error: lessonInsertErrorMessage(error) },
      { status: 500 },
    )
  }

  const data = rows[0]

  await admin
    .from("courses")
    .update({ lessons_count: position })
    .eq("id", body.courseId)

  return NextResponse.json({ lesson: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: {
    id?: string
    courseId?: string
    title?: string
    week?: number | string
    video_url?: string
    video_title?: string
    duration?: string
    position?: number
    topics?: string[] | string
    direction?: "up" | "down"
    quiz_title?: string
    quiz_num_questions?: number | string
    quiz_description?: string
    assignment_title?: string
    assignment_description?: string
    assignment_format?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.id || !body.courseId) {
    return NextResponse.json({ error: "id and courseId are required" }, { status: 400 })
  }

  const admin = getAdminDb()

  if (body.direction) {
    const { data: lessons } = await admin
      .from("lessons")
      .select("id, position")
      .eq("course_id", body.courseId)
      .order("position", { ascending: true })

    const list = lessons || []
    const index = list.findIndex((l) => l.id === body.id)
    if (index === -1) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const swapIndex = body.direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= list.length) {
      return NextResponse.json({ success: true })
    }

    const current = list[index]
    const target = list[swapIndex]
    await admin.from("lessons").update({ position: target.position }).eq("id", current.id)
    await admin.from("lessons").update({ position: current.position }).eq("id", target.id)

    return NextResponse.json({ success: true })
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.week !== undefined) updates.week = body.week ? Number(body.week) : null
  if (body.video_url !== undefined) updates.video_url = body.video_url?.trim() || null
  if (body.video_title !== undefined) updates.video_title = body.video_title?.trim() || null
  if (body.duration !== undefined) updates.duration = body.duration?.trim() || null
  if (body.position !== undefined) updates.position = body.position
  if (body.topics !== undefined) updates.topics = parseTopics(body.topics)
  if (body.quiz_title !== undefined) updates.quiz_title = body.quiz_title?.trim() || null
  if (body.quiz_num_questions !== undefined) {
    updates.quiz_num_questions = body.quiz_num_questions
      ? Number(body.quiz_num_questions)
      : null
  }
  if (body.quiz_description !== undefined) {
    updates.quiz_description = body.quiz_description?.trim() || null
  }
  if (body.assignment_title !== undefined) {
    updates.assignment_title = body.assignment_title?.trim() || null
  }
  if (body.assignment_description !== undefined) {
    updates.assignment_description = body.assignment_description?.trim() || null
  }
  if (body.assignment_format !== undefined) {
    updates.assignment_format = body.assignment_format?.trim() || null
  }

  const { data, error } = await admin
    .from("lessons")
    .update(updates)
    .eq("id", body.id)
    .eq("course_id", body.courseId)
    .select(LESSON_IMPORT_SELECT)
    .single()

  if (error) {
    if (isLessonAssessmentColumnError(error)) {
      const retry = await admin
        .from("lessons")
        .update(stripLessonAssessmentFields(updates))
        .eq("id", body.id)
        .eq("course_id", body.courseId)
        .select(LESSON_IMPORT_SELECT.replace(/,?\s*quiz_title.*assignment_format/, ""))
        .single()
      if (retry.error) {
        return NextResponse.json({ error: lessonInsertErrorMessage(retry.error) }, { status: 500 })
      }
      return NextResponse.json({ lesson: retry.data })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lesson: data })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id")
  const courseId = new URL(request.url).searchParams.get("courseId")
  if (!id) {
    return NextResponse.json({ error: "Lesson id is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { error } = await admin.from("lessons").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (courseId) {
    const { data: remaining } = await admin
      .from("lessons")
      .select("id, position")
      .eq("course_id", courseId)
      .order("position", { ascending: true })

    await Promise.all(
      (remaining || []).map((lesson, index) =>
        admin
          .from("lessons")
          .update({ position: index + 1 })
          .eq("id", lesson.id),
      ),
    )

    await admin
      .from("courses")
      .update({ lessons_count: remaining?.length ?? 0 })
      .eq("id", courseId)
  }

  return NextResponse.json({ success: true })
}
