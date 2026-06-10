import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"

export const revalidate = 300

export async function GET() {
  try {
    const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false },
    })

    const [students, courses, certificates] = await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }),
      admin.from("courses").select("*", { count: "exact", head: true }).eq("status", "published"),
      admin.from("certificates").select("*", { count: "exact", head: true }),
    ])

    return NextResponse.json({
      students: students.count ?? 0,
      courses: courses.count ?? 0,
      certificates: certificates.count ?? 0,
    })
  } catch (error) {
    console.error("Failed to load platform stats:", error)
    return NextResponse.json({ students: 0, courses: 0, certificates: 0 })
  }
}
