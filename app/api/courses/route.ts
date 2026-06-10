import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getPublicCourses, getTutorBrowseCourses } from "@/lib/courses-db"
import { isStaffRole, normalizeRole } from "@/lib/admin"
import { PUBLIC_CACHE_TTL_MS, withServerCache } from "@/lib/server-cache"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = normalizeRole(profile?.role)
      if (isStaffRole(role)) {
        const courses = await getTutorBrowseCourses(supabase, user.id)
        return NextResponse.json(
          { courses },
          { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } },
        )
      }
    }

    const courses = await withServerCache("public:courses", PUBLIC_CACHE_TTL_MS, getPublicCourses)
    return NextResponse.json(
      { courses },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } },
    )
  } catch (error) {
    console.error("Failed to load courses:", error)
    return NextResponse.json({ courses: [] }, { status: 200 })
  }
}
