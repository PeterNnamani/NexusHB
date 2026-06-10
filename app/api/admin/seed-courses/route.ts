import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { promises as fs } from "fs"
import path from "path"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"

// One-time importer that loads public/courses.json into the courses/lessons
// tables. Protected by SEED_SECRET. Idempotent: re-running upserts by slug and
// replaces that course's lessons.
//
// Usage:
//   POST /api/admin/seed-courses   header: x-seed-secret: <SEED_SECRET>

const PLACEHOLDER_HOSTS = ["via.placeholder.com", "placeholder.com"]

function isPlaceholderUrl(url: string | undefined): boolean {
  if (!url) return true
  return PLACEHOLDER_HOSTS.some((h) => url.includes(h))
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-seed-secret") || ""
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  let supabase
  try {
    supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 })
  }

  let json: any
  try {
    const file = await fs.readFile(path.join(process.cwd(), "public", "courses.json"), "utf-8")
    json = JSON.parse(file)
  } catch {
    return NextResponse.json({ success: false, message: "courses.json not found" }, { status: 404 })
  }

  const courses: any[] = json.courses || []
  const results: { slug: string; lessons: number }[] = []

  for (const c of courses) {
    const slug = String(c.id)

    const { data: courseRow, error: courseErr } = await supabase
      .from("courses")
      .upsert(
        {
          slug,
          title: c.title,
          description: c.description ?? null,
          category: c.category ?? null,
          instructor: c.instructor ?? null,
          price: Number(c.price) || 0,
          earnings_potential: c.earningsPotential != null ? Number(c.earningsPotential) : null,
          image: c.image ?? null,
          level: c.level ?? null,
          duration: c.duration ?? null,
          rating: c.rating != null ? Number(c.rating) : 0,
          students_count: Number(c.students) || 0,
          status: "published",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single()

    if (courseErr || !courseRow) {
      return NextResponse.json(
        { success: false, message: `Failed upserting course ${slug}: ${courseErr?.message}` },
        { status: 500 },
      )
    }

    const courseId = courseRow.id

    // Replace lessons + materials for this course
    await supabase.from("lessons").delete().eq("course_id", courseId)
    await supabase.from("course_materials").delete().eq("course_id", courseId)

    const syllabus: any[] = Array.isArray(c.syllabus) ? c.syllabus : []
    let lessonCount = 0

    for (let i = 0; i < syllabus.length; i++) {
      const w = syllabus[i]
      const video = Array.isArray(w.videos) && w.videos.length > 0 ? w.videos[0] : null

      const { data: lessonRow } = await supabase
        .from("lessons")
        .insert({
          course_id: courseId,
          position: i + 1,
          week: w.week ?? i + 1,
          title: w.topic ?? `Week ${i + 1}`,
          topics: Array.isArray(w.topics) ? w.topics : [],
          video_url: video?.url ?? null,
          video_title: video?.title ?? null,
          video_duration: video?.duration ?? null,
          duration: w.duration ?? null,
          quiz_title: w.quiz?.title ?? null,
          quiz_num_questions: w.quiz?.num_questions ?? null,
          quiz_description: w.quiz?.description ?? null,
        })
        .select("id")
        .single()

      lessonCount++

      // Import only real (non-placeholder) materials
      const materials: any[] = Array.isArray(w.materials) ? w.materials : []
      for (const m of materials) {
        if (isPlaceholderUrl(m.url)) continue
        await supabase.from("course_materials").insert({
          course_id: courseId,
          lesson_id: lessonRow?.id ?? null,
          title: m.title ?? "Material",
          url: m.url,
          type: m.type ?? "link",
        })
      }
    }

    await supabase.from("courses").update({ lessons_count: lessonCount }).eq("id", courseId)
    results.push({ slug, lessons: lessonCount })
  }

  return NextResponse.json({ success: true, imported: results.length, results })
}
