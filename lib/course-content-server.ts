import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"
import { mapCourseProject } from "@/lib/assessments"
import { toCoursePreview, type CourseAccessLevel } from "@/lib/course-access"
import {
  getCourseWithContentForClient,
  mapCourse,
  type CourseWithContent,
} from "@/lib/courses-db"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"

function serviceClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })
}

/** Syllabus outline (titles only) for public marketing — no media URLs. */
export async function buildCoursePreviewContent(
  courseRow: Record<string, unknown>,
): Promise<CourseWithContent> {
  const admin = serviceClient()
  const courseId = String(courseRow.id)

  const { data: lessonRows } = await admin
    .from("lessons")
    .select("id, week, position, title, duration, topics")
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  const syllabus = (lessonRows ?? []).map((l) => ({
    lessonId: l.id,
    week: l.week ?? l.position,
    topic: l.title,
    duration: l.duration ?? "",
    topics: Array.isArray(l.topics) ? l.topics : [],
    videos: [],
    materials: [],
    quiz: null,
    assignment: null,
  }))

  return toCoursePreview({
    ...mapCourse(courseRow),
    syllabus,
    materials: [],
    project: mapCourseProject(courseRow) ?? null,
  })
}

export async function resolveCourseForRequest(
  supabase: SupabaseClient,
  idOrSlug: string,
  canAccessFull: boolean,
): Promise<{ course: CourseWithContent; access: CourseAccessLevel } | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrSlug,
  )

  const { data: courseRow, error } = await supabase
    .from("courses")
    .select("*")
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle()

  if (error || !courseRow) return null

  if (canAccessFull) {
    const full = await getCourseWithContentForClient(supabase, idOrSlug)
    if (!full) return null
    return { course: full, access: "full" }
  }

  const preview = await buildCoursePreviewContent(courseRow as Record<string, unknown>)
  return { course: preview, access: "preview" }
}

/** Staff / chat: load full content for an enrolled course via the user's session. */
export async function loadEnrolledCourseContent(
  supabase: SupabaseClient,
  courseId: string,
): Promise<CourseWithContent | null> {
  return getCourseWithContentForClient(supabase, courseId)
}
