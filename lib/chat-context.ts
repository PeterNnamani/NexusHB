import { createClient as createServerClient } from "@/lib/supabase-server"
import type { CourseWithContent } from "@/lib/courses-db"
import { loadEnrolledCourseContent } from "@/lib/course-content-server"
import { decodeDocumentMaterialUrl, isDocumentMaterialUrl } from "@/lib/format-material"
import { getAdminDb } from "@/lib/admin-auth"
import { isStaffRole, normalizeRole } from "@/lib/admin"

const MAX_COURSES = 6
const MAX_MATERIAL_CHARS = 500
const MAX_TOPICS_PER_LESSON = 12

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function materialSnippet(url: string, title: string): string {
  if (isDocumentMaterialUrl(url)) {
    return truncate(decodeDocumentMaterialUrl(url), MAX_MATERIAL_CHARS)
  }
  return url
}

function formatCourseBlock(course: CourseWithContent, focus = false): string {
  const header = focus
    ? `### [ACTIVE] ${course.title}`
    : `### ${course.title}`

  const meta = [
    course.category && `Category: ${course.category}`,
    course.level && `Level: ${course.level}`,
    course.duration && `Duration: ${course.duration}`,
    course.instructor && `Instructor: ${course.instructor}`,
  ]
    .filter(Boolean)
    .join(" · ")

  const lines: string[] = [header]
  if (meta) lines.push(meta)
  if (course.description) lines.push(`Description: ${truncate(course.description, 400)}`)

  for (const week of course.syllabus) {
    lines.push("")
    lines.push(
      `**Topic ${week.week}: ${week.topic}**${week.duration ? ` (${week.duration})` : ""}`,
    )
    if (week.topics.length > 0) {
      const shown = week.topics.slice(0, MAX_TOPICS_PER_LESSON)
      lines.push(`Objectives: ${shown.join("; ")}`)
      if (week.topics.length > MAX_TOPICS_PER_LESSON) {
        lines.push(`(+${week.topics.length - MAX_TOPICS_PER_LESSON} more objectives)`)
      }
    }
    if (week.videos.length > 0) {
      for (const v of week.videos) {
        lines.push(`Video: ${v.title}${v.duration ? ` — ${v.duration}` : ""}`)
      }
    }
    for (const m of week.materials) {
      const body = materialSnippet(m.url, m.title)
      lines.push(`Material [${m.type}]: ${m.title}`)
      if (body && !body.startsWith("http")) lines.push(body)
      else if (body.startsWith("http")) lines.push(`Link: ${body}`)
    }
  }

  const orphanMaterials = course.materials.filter(
    (m) => !course.syllabus.some((w) => w.materials.some((wm) => wm.id === m.id)),
  )
  if (orphanMaterials.length > 0) {
    lines.push("", "**Course-wide materials:**")
    for (const m of orphanMaterials) {
      lines.push(`- ${m.title} [${m.type}]`)
    }
  }

  return lines.join("\n")
}

async function loadCourseContent(courseId: string): Promise<CourseWithContent | null> {
  const supabase = await createServerClient()
  return loadEnrolledCourseContent(supabase, courseId)
}

async function loadStaffCourseContent(
  courseId: string,
  instructorId: string,
): Promise<CourseWithContent | null> {
  const admin = getAdminDb()
  const { data: courseRow } = await admin
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("instructor_id", instructorId)
    .maybeSingle()

  if (!courseRow) return null

  const { data: lessonRows } = await admin
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  const { data: materialRows } = await admin
    .from("course_materials")
    .select("*")
    .eq("course_id", courseId)

  const base = await getCourseWithContent(courseId)
  if (base) return base

  const syllabus = (lessonRows ?? []).map((l: Record<string, unknown>) => ({
    week: Number(l.week ?? l.position) || 1,
    topic: String(l.title ?? ""),
    duration: String(l.duration ?? ""),
    topics: Array.isArray(l.topics) ? (l.topics as string[]) : [],
    videos: l.video_url
      ? [
          {
            id: String(l.id),
            title: String(l.video_title ?? l.title ?? ""),
            url: String(l.video_url),
            duration: String(l.duration ?? ""),
          },
        ]
      : [],
    materials: (materialRows ?? [])
      .filter((m: Record<string, unknown>) => m.lesson_id === l.id)
      .map((m: Record<string, unknown>) => ({
        id: String(m.id),
        title: String(m.title ?? ""),
        url: String(m.url ?? ""),
        type: String(m.type ?? "link"),
      })),
  }))

  return {
    id: String(courseRow.id),
    slug: String(courseRow.slug ?? ""),
    title: String(courseRow.title ?? ""),
    description: String(courseRow.description ?? ""),
    category: String(courseRow.category ?? ""),
    instructor: String(courseRow.instructor ?? ""),
    price: Number(courseRow.price) || 0,
    earningsPotential: Number(courseRow.earnings_potential) || 0,
    image: String(courseRow.image ?? ""),
    level: String(courseRow.level ?? ""),
    duration: String(courseRow.duration ?? ""),
    rating: Number(courseRow.rating) || 0,
    students: Number(courseRow.students_count) || 0,
    lessons: Number(courseRow.lessons_count) || 0,
    syllabus,
    materials: (materialRows ?? []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      title: String(m.title ?? ""),
      url: String(m.url ?? ""),
      type: String(m.type ?? "link"),
    })),
  }
}

export type ChatUserContext = {
  userName: string
  role: string
  enrolledCourseIds: string[]
  teachingCourseIds: string[]
  courseBlocks: string[]
  activeCourseTitle: string | null
}

export async function buildChatUserContext(options: {
  userId: string
  userName?: string
  role?: string
  mode: "learning" | "teaching"
  activeCourseId?: string | null
}): Promise<ChatUserContext | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== options.userId) return null

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle()

  const role = normalizeRole(options.role || profile?.role)
  const userName = options.userName || profile?.name || "there"

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .in("status", ["active", "completed"])

  const enrolledCourseIds = (enrollments || []).map((e) => String(e.course_id))

  let teachingCourseIds: string[] = []
  if (options.mode === "teaching" && isStaffRole(role)) {
    const { data: owned } = await supabase
      .from("courses")
      .select("id")
      .eq("instructor_id", user.id)
    teachingCourseIds = (owned || []).map((c) => String(c.id))
  }

  const relevantIds =
    options.mode === "teaching"
      ? [...new Set([...teachingCourseIds, ...enrolledCourseIds])]
      : enrolledCourseIds

  const orderedIds: string[] = []
  if (options.activeCourseId && relevantIds.includes(options.activeCourseId)) {
    orderedIds.push(options.activeCourseId)
  }
  for (const id of relevantIds) {
    if (!orderedIds.includes(id)) orderedIds.push(id)
    if (orderedIds.length >= MAX_COURSES) break
  }

  const courseBlocks: string[] = []
  let activeCourseTitle: string | null = null

  for (const courseId of orderedIds) {
    const course =
      options.mode === "teaching" && teachingCourseIds.includes(courseId)
        ? await loadStaffCourseContent(courseId, user.id)
        : await loadCourseContent(courseId)

    if (!course) continue
    const isActive = courseId === options.activeCourseId
    if (isActive) activeCourseTitle = course.title
    courseBlocks.push(formatCourseBlock(course, isActive))
  }

  return {
    userName,
    role,
    enrolledCourseIds,
    teachingCourseIds,
    courseBlocks,
    activeCourseTitle,
  }
}
