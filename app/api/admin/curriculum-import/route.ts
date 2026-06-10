import { NextRequest, NextResponse } from "next/server"

import { requireContentAuth, getAdminDb } from "@/lib/admin-auth"

import { assertCourseContentAccess } from "@/lib/course-content-access"

import {
  assignmentToMaterialRow,
  quizToMaterialRow,
} from "@/lib/assessment-materials"
import { saveCourseProject } from "@/lib/course-db"
import { encodeDocumentMaterial } from "@/lib/format-material"
import {
  insertLessons,
  lessonInsertErrorMessage,
  LESSON_IMPORT_SELECT,
} from "@/lib/lesson-db"

import { normalizeParsedCurriculum } from "@/lib/parse-curriculum"

import { invalidateServerCache } from "@/lib/server-cache"



export const dynamic = "force-dynamic"



const MATERIAL_SELECT = "id, title, url, type, lesson_id"



function parseTopics(topics: string[]): string[] {

  return topics.map((t) => t.trim()).filter(Boolean)

}



export async function POST(request: NextRequest) {

  const auth = await requireContentAuth()

  if ("error" in auth) return auth.error



  let body: { courseId?: string; curriculum?: unknown; replace?: boolean }

  try {

    body = await request.json()

  } catch {

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  }



  const courseId = body.courseId?.trim()

  if (!courseId) {

    return NextResponse.json({ error: "courseId is required" }, { status: 400 })

  }



  const replace = body.replace !== false



  const { lessons, project } = normalizeParsedCurriculum(body.curriculum ?? {})

  if (lessons.length === 0) {

    return NextResponse.json({ error: "No lessons to import" }, { status: 400 })

  }



  const admin = getAdminDb()

  const access = await assertCourseContentAccess(admin, auth, courseId)

  if (access !== true) return access



  let existingLessonIds: string[] = []

  if (replace) {

    const { data: existing } = await admin

      .from("lessons")

      .select("id")

      .eq("course_id", courseId)

    existingLessonIds = (existing || []).map((row) => row.id)

  }



  let position = 0

  if (!replace) {

    const { count } = await admin

      .from("lessons")

      .select("*", { count: "exact", head: true })

      .eq("course_id", courseId)

    position = count ?? 0

  }



  const lessonRows = lessons.map((lesson) => {

    position += 1

    return {

      course_id: courseId,

      title: lesson.title.trim(),

      week: lesson.week ?? position,

      position,

      video_url: lesson.videoUrl?.trim() || null,

      video_title: lesson.videoTitle?.trim() || lesson.title.trim(),

      duration: lesson.duration?.trim() || null,

      topics: parseTopics(lesson.topics || []),

      quiz_title: lesson.quiz?.title?.trim() || null,

      quiz_num_questions: lesson.quiz?.numQuestions ?? null,

      quiz_description: lesson.quiz?.description?.trim() || null,

      assignment_title: lesson.assignment?.title?.trim() || null,

      assignment_description: lesson.assignment?.description?.trim() || null,

      assignment_format: lesson.assignment?.format?.trim() || null,

    }

  })



  // Insert new lessons first — existing curriculum stays intact if this fails.

  const {
    data: insertedLessons,
    error: lessonError,
    assessmentsInDb,
  } = await insertLessons(admin, lessonRows, LESSON_IMPORT_SELECT)



  if (lessonError || !insertedLessons?.length) {

    console.error("curriculum-import lesson error:", lessonError)

    return NextResponse.json(

      { error: lessonInsertErrorMessage(lessonError) },

      { status: 500 },

    )

  }



  const materialRows: {

    course_id: string

    lesson_id: string

    title: string

    url: string

    type: string

  }[] = []



  insertedLessons.forEach((row, i) => {

    const lesson = lessons[i]

    if (!lesson) return

    for (const material of lesson.materials || []) {
      const title = material.title?.trim()
      if (!title) continue
      const content = material.content?.trim()
      const url = material.url?.trim()
      if (!content && !url) continue
      materialRows.push({
        course_id: courseId,
        lesson_id: row.id,
        title,
        url: content ? encodeDocumentMaterial(content) : url!,
        type: content ? "document" : material.type || "link",
      })
    }

    if (!assessmentsInDb) {
      if (lesson.quiz?.title || lesson.quiz?.description) {
        materialRows.push(
          quizToMaterialRow(courseId, row.id, {
            title: lesson.quiz.title || `Week ${lesson.week ?? i + 1} Quiz`,
            numQuestions: lesson.quiz.numQuestions,
            description: lesson.quiz.description,
          }),
        )
      }
      if (lesson.assignment?.title || lesson.assignment?.description) {
        materialRows.push(
          assignmentToMaterialRow(courseId, row.id, {
            title: lesson.assignment.title || `Week ${lesson.week ?? i + 1} Assignment`,
            description: lesson.assignment.description || "",
            format: lesson.assignment.format,
          }),
        )
      }
    }
  })



  let insertedMaterials: { id: string; title: string; url: string; type: string; lesson_id: string | null }[] = []

  if (materialRows.length > 0) {

    const { data, error: matError } = await admin

      .from("course_materials")

      .insert(materialRows)

      .select(MATERIAL_SELECT)

    if (matError) {

      console.error("curriculum-import materials error:", matError)

      // Roll back newly inserted lessons so we don't leave duplicates.

      await admin

        .from("lessons")

        .delete()

        .in(

          "id",

          insertedLessons.map((l) => l.id),

        )

      return NextResponse.json(

        { error: matError.message || "Failed to import materials" },

        { status: 500 },

      )

    }

    insertedMaterials = data || []

  }



  if (replace) {

    if (existingLessonIds.length > 0) {

      const { error: matDeleteError } = await admin

        .from("course_materials")

        .delete()

        .in("lesson_id", existingLessonIds)

      if (matDeleteError) {

        console.error("curriculum-import delete old materials:", matDeleteError)

      }



      const { error: lessonDeleteError } = await admin

        .from("lessons")

        .delete()

        .in("id", existingLessonIds)

      if (lessonDeleteError) {

        console.error("curriculum-import delete old lessons:", lessonDeleteError)

        return NextResponse.json(

          { error: "New curriculum saved but failed to remove the previous version. Refresh and try again." },

          { status: 500 },

        )

      }

    }



    const { error: orphanMatError } = await admin

      .from("course_materials")

      .delete()

      .eq("course_id", courseId)

      .is("lesson_id", null)

    if (orphanMatError) {

      console.error("curriculum-import delete orphan materials:", orphanMatError)

    }

  }



  const lessonsCreated = insertedLessons.length

  const materialsCreated = insertedMaterials.length

  const assignmentsCreated = lessons.filter((l) => l.assignment?.title).length

  const quizzesCreated = lessons.filter((l) => l.quiz?.title || l.quiz?.description).length

  const warnings: string[] = []
  if (!assessmentsInDb) {
    warnings.push(
      "Quizzes and assignments were saved as course materials. Run course_assessments_migration.sql in Supabase for dedicated quiz/assignment fields.",
    )
  }

  const { error: courseCountError } = await admin
    .from("courses")
    .update({ lessons_count: position, updated_at: new Date().toISOString() })
    .eq("id", courseId)
  if (courseCountError) console.error("curriculum-import lessons_count:", courseCountError)

  let projectResult = { saved: false, project: null as Record<string, string | null> | null, viaMaterial: false }
  if (project?.title) {
    projectResult = await saveCourseProject(admin, courseId, {
      title: project.title.trim(),
      description: project.description?.trim() || null,
      instructions: project.instructions?.trim() || null,
      format:
        project.format?.trim() ||
        "Submit GitHub repo + live demo URLs and a project summary.",
    }, false)
  } else if (replace) {
    projectResult = await saveCourseProject(admin, courseId, null, true)
  }

  const projectSaved = projectResult.saved && !!projectResult.project?.project_title
  const savedProject = projectResult.project

  if (projectResult.viaMaterial && projectSaved) {
    warnings.push(
      "Final project was saved as a course material. Run course_assessments_migration.sql in Supabase to store it on the course record.",
    )
  }



  invalidateServerCache("public:courses")

  invalidateServerCache("admin:")



  return NextResponse.json({

    success: true,

    replaced: replace,

    lessonsCreated,

    materialsCreated,

    assignmentsCreated,

    quizzesCreated,

    projectSaved,

    lessons: insertedLessons,

    materials: insertedMaterials,

    project: savedProject,
    warnings,
    assessmentsViaMaterials: !assessmentsInDb,
    projectViaMaterials: projectResult.viaMaterial,

  })

}

