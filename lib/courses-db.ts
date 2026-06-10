import type { SupabaseClient } from "@supabase/supabase-js"
import { createRestClient, isSupabaseConfigured } from "@/lib/supabase-rest"
import { materialsForLessonAssessments, projectFromMaterials } from "@/lib/assessment-materials"
import {
  mapCourseProject,
  mapLessonAssignment,
  mapLessonQuiz,
  type CourseProject,
  type LessonAssignment,
  type LessonQuiz,
} from "@/lib/assessments"

// Server-side course data access backed by Supabase. Public reads rely on RLS
// (published courses are world-readable). Do not import this into client
// components - use the /api/courses endpoints instead.

export interface PublicCourse {
  id: string
  slug: string
  title: string
  description: string
  category: string
  instructor: string
  instructorId?: string
  status?: string
  price: number
  earningsPotential: number
  image: string
  level: string
  duration: string
  rating: number
  students: number
  lessons: number
}

export interface CourseVideo {
  id: string
  title: string
  url: string
  duration: string
}

export interface CourseMaterial {
  id: string
  title: string
  url: string
  type: string
}

export interface SyllabusWeek {
  lessonId: string
  week: number
  topic: string
  duration: string
  topics: string[]
  videos: CourseVideo[]
  materials: CourseMaterial[]
  quiz: LessonQuiz | null
  assignment: LessonAssignment | null
}

export interface CourseWithContent extends PublicCourse {
  syllabus: SyllabusWeek[]
  materials: CourseMaterial[]
  project: CourseProject | null
}

function anonClient() {
  return createRestClient()
}

export function mapCourse(row: any): PublicCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    instructor: row.instructor ?? "",
    instructorId: row.instructor_id ?? undefined,
    status: row.status ?? "published",
    price: Number(row.price) || 0,
    earningsPotential: row.earnings_potential != null ? Number(row.earnings_potential) : 0,
    image: row.image ?? "",
    level: row.level ?? "",
    duration: row.duration ?? "",
    rating: row.rating != null ? Number(row.rating) : 0,
    students: row.students_count ?? 0,
    lessons: row.lessons_count ?? 0,
  }
}

export async function getPublicCourses(): Promise<PublicCourse[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = anonClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data.map(mapCourse)
}

/** Published catalog plus the tutor's own courses (any status). */
export async function getTutorBrowseCourses(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<PublicCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .or(`status.eq.published,instructor_id.eq.${tutorId}`)
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return data.map(mapCourse)
}

export async function getCourseWithContentForClient(
  supabase: SupabaseClient,
  idOrSlug: string,
): Promise<CourseWithContent | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const { data: courseRow, error } = await supabase
    .from("courses")
    .select("*")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle()

  if (error || !courseRow) return null

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseRow.id)
    .order("position", { ascending: true })

  const { data: materialRows } = await supabase
    .from("course_materials")
    .select("*")
    .eq("course_id", courseRow.id)

  const materials: CourseMaterial[] = (materialRows ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    url: m.url,
    type: m.type ?? "link",
    lessonId: m.lesson_id,
  })) as any

  const allMaterials = (materialRows ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    url: m.url,
    type: m.type ?? "link",
    lesson_id: m.lesson_id,
  }))

  const syllabus: SyllabusWeek[] = (lessonRows ?? []).map((l: any) => {
    const fromColumns = {
      quiz: mapLessonQuiz(l),
      assignment: mapLessonAssignment(l),
    }
    const fromMaterials = materialsForLessonAssessments(allMaterials, l.id)
    const lessonMaterials = allMaterials.filter(
      (m) => m.lesson_id === l.id && m.type !== "quiz" && m.type !== "assignment",
    )

    return {
      lessonId: l.id,
      week: l.week ?? l.position,
      topic: l.title,
      duration: l.duration ?? "",
      topics: Array.isArray(l.topics) ? l.topics : [],
      videos: l.video_url
        ? [
            {
              id: l.id,
              title: l.video_title ?? l.title,
              url: l.video_url,
              duration: l.duration ?? l.video_duration ?? "",
            },
          ]
        : [],
      materials: lessonMaterials.map((m) => ({
        id: m.id,
        title: m.title,
        url: m.url,
        type: m.type,
      })),
      quiz: fromColumns.quiz ?? fromMaterials.quiz,
      assignment: fromColumns.assignment ?? fromMaterials.assignment,
    }
  })

  return {
    ...mapCourse(courseRow),
    syllabus,
    materials: allMaterials
      .filter((m) => !["quiz", "assignment", "project"].includes(m.type))
      .map((m) => ({ id: m.id, title: m.title, url: m.url, type: m.type })),
    project: mapCourseProject(courseRow) ?? projectFromMaterials(allMaterials),
  }
}

/** @deprecated Prefer resolveCourseForRequest or getCourseWithContentForClient with auth. */
export async function getCourseWithContent(idOrSlug: string): Promise<CourseWithContent | null> {
  if (!isSupabaseConfigured()) return null
  return getCourseWithContentForClient(anonClient(), idOrSlug)
}
