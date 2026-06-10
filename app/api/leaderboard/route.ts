import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId")

  try {
    const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false },
    })

    const { data, error } = await admin
      .from("users")
      .select("id, name, points, streak, completed_courses")
      .order("points", { ascending: false })
      .limit(10)

    if (error) throw error

    const topUsers = (data || []).map((u) => ({
      id: u.id,
      name: u.name?.trim() || "Learner",
      points: u.points ?? 0,
      streak: u.streak ?? 0,
      completedCourses: Array.isArray(u.completed_courses) ? u.completed_courses.length : 0,
    }))

    return NextResponse.json({ courseId: courseId || "current", topUsers })
  } catch (error) {
    console.error("Failed to load leaderboard:", error)
    return NextResponse.json({ courseId: courseId || "current", topUsers: [] })
  }
}
