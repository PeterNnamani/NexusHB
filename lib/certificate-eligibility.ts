import type { SupabaseClient } from "@supabase/supabase-js"

const MIN_COMPLETION_PROGRESS = 100

export type CertificateEligibility =
  | { eligible: true }
  | { eligible: false; reason: string }

export async function checkCertificateEligibility(
  db: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<CertificateEligibility> {
  const { data: enrollment } = await db
    .from("enrollments")
    .select("status, progress")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle()

  if (!enrollment) {
    return { eligible: false, reason: "You must be enrolled in this course" }
  }

  const progress = Number(enrollment.progress) || 0
  const completed =
    enrollment.status === "completed" || progress >= MIN_COMPLETION_PROGRESS

  if (!completed) {
    return {
      eligible: false,
      reason: "Complete the course (100% progress) before requesting a certificate",
    }
  }

  return { eligible: true }
}
