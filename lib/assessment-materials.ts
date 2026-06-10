import {
  decodeDocumentMaterialUrl,
  encodeDocumentMaterial,
  isDocumentMaterialUrl,
} from "@/lib/format-material"
import type {
  CourseProject,
  LessonAssignment,
  LessonQuiz,
} from "@/lib/assessments"

export type AssessmentMaterialType = "quiz" | "assignment" | "project"

export type MaterialRow = {
  id?: string
  title: string
  url: string
  type: string
  lesson_id?: string | null
}

export type MaterialInsertRow = {
  course_id: string
  lesson_id: string | null
  title: string
  url: string
  type: string
}

export function encodeProjectMaterial(project: {
  title: string
  description?: string | null
  instructions?: string | null
  format?: string | null
}): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(project),
  )}`
}

export function decodeProjectMaterial(url: string): CourseProject | null {
  if (!url.startsWith("data:application/json")) return null
  const comma = url.indexOf(",")
  if (comma === -1) return null
  try {
    const raw = JSON.parse(decodeURIComponent(url.slice(comma + 1))) as Record<
      string,
      unknown
    >
    const title = String(raw.title || "").trim()
    if (!title) return null
    return {
      title,
      description: raw.description ? String(raw.description).trim() : null,
      instructions: raw.instructions ? String(raw.instructions).trim() : null,
      format: raw.format ? String(raw.format).trim() : null,
    }
  } catch {
    return null
  }
}

export function quizToMaterialRow(
  courseId: string,
  lessonId: string,
  quiz: { title: string; numQuestions?: number; description?: string },
): MaterialInsertRow {
  const lines: string[] = []
  if (quiz.numQuestions != null) lines.push(`Questions: ${quiz.numQuestions}`)
  if (quiz.description?.trim()) lines.push(quiz.description.trim())
  return {
    course_id: courseId,
    lesson_id: lessonId,
    title: quiz.title,
    type: "quiz",
    url: encodeDocumentMaterial(lines.join("\n\n")),
  }
}

export function assignmentToMaterialRow(
  courseId: string,
  lessonId: string,
  assignment: { title: string; description: string; format?: string },
): MaterialInsertRow {
  const lines = [assignment.description.trim()]
  if (assignment.format?.trim()) lines.push(`Format: ${assignment.format.trim()}`)
  return {
    course_id: courseId,
    lesson_id: lessonId,
    title: assignment.title,
    type: "assignment",
    url: encodeDocumentMaterial(lines.filter(Boolean).join("\n\n")),
  }
}

export function projectToMaterialRow(
  courseId: string,
  project: {
    title: string
    description?: string | null
    instructions?: string | null
    format?: string | null
  },
): MaterialInsertRow {
  return {
    course_id: courseId,
    lesson_id: null,
    title: project.title,
    type: "project",
    url: encodeProjectMaterial(project),
  }
}

function countNumberedQuestions(text: string): number | null {
  const matches = text.match(/^\d+[\).]\s/gm)
  return matches?.length ? matches.length : null
}

export function quizFromMaterial(material: MaterialRow): LessonQuiz | null {
  if (material.type !== "quiz") return null
  const description = isDocumentMaterialUrl(material.url)
    ? decodeDocumentMaterialUrl(material.url)
    : material.url
  if (!description.trim()) return null
  return {
    title: material.title,
    numQuestions: countNumberedQuestions(description),
    description: description.trim(),
  }
}

export function assignmentFromMaterial(material: MaterialRow): LessonAssignment | null {
  if (material.type !== "assignment") return null
  const body = isDocumentMaterialUrl(material.url)
    ? decodeDocumentMaterialUrl(material.url)
    : material.url
  if (!body.trim()) return null
  const formatMatch = body.match(/\nFormat:\s*(.+)$/i)
  const description = formatMatch ? body.replace(/\nFormat:\s*.+$/i, "").trim() : body.trim()
  return {
    title: material.title,
    description,
    format: formatMatch?.[1]?.trim() || null,
  }
}

export function projectFromMaterials(materials: MaterialRow[]): CourseProject | null {
  const row = materials.find((m) => m.type === "project")
  if (!row) return null
  return decodeProjectMaterial(row.url)
}

export function materialsForLessonAssessments(
  materials: MaterialRow[],
  lessonId: string,
): { quiz: LessonQuiz | null; assignment: LessonAssignment | null } {
  const lessonMaterials = materials.filter((m) => m.lesson_id === lessonId)
  return {
    quiz: lessonMaterials.map(quizFromMaterial).find(Boolean) ?? null,
    assignment: lessonMaterials.map(assignmentFromMaterial).find(Boolean) ?? null,
  }
}
