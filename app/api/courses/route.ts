import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getPublicCourses, getTutorBrowseCourses, type PublicCourse } from "@/lib/courses-db"
import { isStaffRole, normalizeRole } from "@/lib/admin"
import { PUBLIC_CACHE_TTL_MS, withServerCache } from "@/lib/server-cache"
import { getVerifiedTutorIds } from "@/lib/subscription-db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let courses: PublicCourse[] | undefined
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = normalizeRole(profile?.role)
      if (isStaffRole(role)) {
        courses = await getTutorBrowseCourses(supabase, user.id)
      }
    }

    courses ??= await withServerCache("public:courses", PUBLIC_CACHE_TTL_MS, getPublicCourses)
    const verifiedTutorIds = await getVerifiedTutorIds(
      courses.map((course) => course.instructorId ?? ""),
    )
    const coursesWithVerification = courses.map((course) => ({
      ...course,
      isVerified: Boolean(course.instructorId && verifiedTutorIds.has(course.instructorId)),
    }))

    return NextResponse.json(
      { courses: coursesWithVerification },
      {
        headers: {
          "Cache-Control": user
            ? "private, max-age=30, stale-while-revalidate=60"
            : "public, max-age=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    console.error("Failed to load courses:", error)
    return NextResponse.json({ courses: [], message: "Failed to load courses" }, { status: 500 })
  }
}
