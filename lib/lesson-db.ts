import type { SupabaseClient } from "@supabase/supabase-js"
import { assessmentTableMissingMessage } from "@/lib/assessments"

export const LESSON_BASE_SELECT =
  "id, title, week, position, video_url, video_title, duration, topics, created_at"

export const LESSON_ASSESSMENT_SELECT =
  "quiz_title, quiz_num_questions, quiz_description, assignment_title, assignment_description, assignment_format"

export const LESSON_IMPORT_SELECT =
  "id, title, week, position, video_url, video_title, duration, topics, quiz_title, quiz_num_questions, quiz_description, assignment_title, assignment_description, assignment_format"

const ASSESSMENT_COLUMN_RE = /(quiz_|assignment_)/i

export function isLessonAssessmentColumnError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false
  return error.code === "PGRST204" || ASSESSMENT_COLUMN_RE.test(error.message || "")
}

export function lessonInsertErrorMessage(error: { message?: string } | null): string {
  const base = error?.message || "Failed to save lessons"
  if (isLessonAssessmentColumnError(error)) {
    return `${base} Run course_assessments_migration.sql in Supabase (see project root).`
  }
  return base
}

export function stripLessonAssessmentFields<T extends Record<string, unknown>>(row: T) {
  const {
    quiz_title: _qt,
    quiz_num_questions: _qn,
    quiz_description: _qd,
    assignment_title: _at,
    assignment_description: _ad,
    assignment_format: _af,
    ...rest
  } = row
  return rest
}

export async function insertLessons(
  admin: SupabaseClient,
  rows: Record<string, unknown>[],
  select = LESSON_IMPORT_SELECT,
) {
  let assessmentsInDb = true
  let result = await admin.from("lessons").insert(rows).select(select)

  if (result.error && isLessonAssessmentColumnError(result.error)) {
    assessmentsInDb = false
    const baseRows = rows.map((row) => stripLessonAssessmentFields(row))
    const baseSelect = LESSON_IMPORT_SELECT.replace(
      /,?\s*quiz_title.*assignment_format/,
      "",
    )
    result = await admin.from("lessons").insert(baseRows).select(baseSelect)
  }

  return { ...result, assessmentsInDb }
}

export async function selectLessonsForCourse(
  admin: SupabaseClient,
  courseId: string,
  select = LESSON_IMPORT_SELECT,
) {
  let result = await admin
    .from("lessons")
    .select(select)
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  if (result.error && isLessonAssessmentColumnError(result.error)) {
    const baseSelect = LESSON_BASE_SELECT
    result = await admin
      .from("lessons")
      .select(baseSelect)
      .eq("course_id", courseId)
      .order("position", { ascending: true })
  }

  return result
}

export { assessmentTableMissingMessage }
