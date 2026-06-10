export type AssessmentKind = "quiz" | "assignment" | "project"

const MIGRATION_HINT =
  "Run course_assessments_migration.sql in the Supabase SQL Editor (see project root)."

/** PostgREST error when a table has not been created yet (PGRST205). */
export function isAssessmentTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === "PGRST205" ||
    /assessment_submissions/i.test(error.message || "")
  )
}

export function assessmentTableMissingMessage(): string {
  return MIGRATION_HINT
}

export type LessonQuiz = {
  title: string
  numQuestions: number | null
  description: string | null
}

export type LessonAssignment = {
  title: string
  description: string | null
  format: string | null
}

export type CourseProject = {
  title: string
  description: string | null
  instructions: string | null
  format: string | null
}

export type QuizSubmissionBody = {
  answers: string
  selfScore?: string
}

export type AssignmentSubmissionBody = {
  url: string
  notes?: string
}

export type ProjectSubmissionBody = {
  urls: string[]
  summary: string
}

export type SubmissionBody =
  | QuizSubmissionBody
  | AssignmentSubmissionBody
  | ProjectSubmissionBody

export const SUBMISSION_LIMITS = {
  quizAnswers: 4000,
  assignmentNotes: 1000,
  projectSummary: 3000,
  projectUrls: 3,
  urlMaxLength: 500,
} as const

export function buildRefKey(
  kind: AssessmentKind,
  courseId: string,
  lessonId?: string | null,
): string {
  if (kind === "project") return `course:${courseId}:project`
  if (!lessonId) throw new Error("lessonId required for quiz/assignment")
  return `lesson:${lessonId}:${kind}`
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function normalizeQuizBody(raw: unknown): QuizSubmissionBody | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const answers = typeof row.answers === "string" ? row.answers.trim() : ""
  if (!answers || answers.length > SUBMISSION_LIMITS.quizAnswers) return null
  const selfScore =
    typeof row.selfScore === "string" && row.selfScore.length <= 20
      ? row.selfScore.trim()
      : undefined
  return { answers, selfScore }
}

export function normalizeAssignmentBody(raw: unknown): AssignmentSubmissionBody | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const url = typeof row.url === "string" ? row.url.trim() : ""
  if (!isValidHttpUrl(url) || url.length > SUBMISSION_LIMITS.urlMaxLength) return null
  const notes =
    typeof row.notes === "string" && row.notes.trim()
      ? row.notes.trim().slice(0, SUBMISSION_LIMITS.assignmentNotes)
      : undefined
  return { url, notes }
}

export function normalizeProjectBody(raw: unknown): ProjectSubmissionBody | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const summary = typeof row.summary === "string" ? row.summary.trim() : ""
  if (!summary || summary.length > SUBMISSION_LIMITS.projectSummary) return null

  const urlsRaw = Array.isArray(row.urls) ? row.urls : []
  const urls = urlsRaw
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => isValidHttpUrl(u) && u.length <= SUBMISSION_LIMITS.urlMaxLength)
    .slice(0, SUBMISSION_LIMITS.projectUrls)

  if (urls.length === 0) return null
  return { urls, summary }
}

export function normalizeSubmissionBody(
  kind: AssessmentKind,
  raw: unknown,
): SubmissionBody | null {
  if (kind === "quiz") return normalizeQuizBody(raw)
  if (kind === "assignment") return normalizeAssignmentBody(raw)
  return normalizeProjectBody(raw)
}

export function mapLessonQuiz(row: Record<string, unknown>): LessonQuiz | null {
  const title = String(row.quiz_title || "").trim()
  if (!title) return null
  return {
    title,
    numQuestions:
      row.quiz_num_questions != null ? Number(row.quiz_num_questions) : null,
    description: row.quiz_description ? String(row.quiz_description).trim() : null,
  }
}

export function mapLessonAssignment(row: Record<string, unknown>): LessonAssignment | null {
  const title = String(row.assignment_title || "").trim()
  if (!title) return null
  return {
    title,
    description: row.assignment_description
      ? String(row.assignment_description).trim()
      : null,
    format: row.assignment_format ? String(row.assignment_format).trim() : null,
  }
}

export function mapCourseProject(row: Record<string, unknown>): CourseProject | null {
  const title = String(row.project_title || "").trim()
  if (!title) return null
  return {
    title,
    description: row.project_description
      ? String(row.project_description).trim()
      : null,
    instructions: row.project_instructions
      ? String(row.project_instructions).trim()
      : null,
    format: row.project_format ? String(row.project_format).trim() : null,
  }
}
