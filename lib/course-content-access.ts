import type { SupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { ContentAuth } from "@/lib/admin-auth"
import { isPlatformContentAdmin } from "@/lib/admin-auth"
import { staffCanManageCourse } from "@/lib/instructor-identity"

export async function assertCourseContentAccess(
  admin: SupabaseClient,
  auth: ContentAuth,
  courseId: string,
): Promise<true | NextResponse> {
  if (isPlatformContentAdmin(auth)) return true

  const { data } = await admin
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .maybeSingle()

  const allowed = await staffCanManageCourse(admin, auth, data?.instructor_id)
  if (!data || !allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return true
}
