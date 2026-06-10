import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { isStaffRole, normalizeRole } from "@/lib/admin"
import type { CourseWithContent } from "@/lib/courses-db"

export type CourseAccessLevel = "full" | "preview"

export async function userCanAccessFullCourseContent(
  supabase: SupabaseClient,
  user: User | null | undefined,
  course: { id: string; instructorId?: string | null },
): Promise<boolean> {
  if (!user) return false

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = normalizeRole(profile?.role)
  if (isStaffRole(role)) return true

  if (course.instructorId && course.instructorId === user.id) return true

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .in("status", ["active", "completed"])
    .maybeSingle()

  return !!enrollment
}

/** Public catalog view — topics visible, media URLs redacted. */
export function toCoursePreview(course: CourseWithContent): CourseWithContent {
  return {
    ...course,
    syllabus: course.syllabus.map((week) => ({
      ...week,
      videos: week.videos.map((v) => ({
        ...v,
        url: "",
      })),
      materials: week.materials.map((m) => ({
        ...m,
        url: "",
      })),
      quiz: week.quiz
        ? { ...week.quiz, description: week.quiz.description ? "[Enroll to view]" : null }
        : null,
      assignment: week.assignment
        ? { ...week.assignment, description: week.assignment.description ? "[Enroll to view]" : null }
        : null,
    })),
    materials: course.materials.map((m) => ({ ...m, url: "" })),
    project: course.project
      ? {
          ...course.project,
          instructions: course.project.instructions ? "[Enroll to view]" : null,
        }
      : null,
  }
}
