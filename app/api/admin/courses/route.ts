import { NextRequest, NextResponse } from "next/server"
import { requireContentAuth, isPlatformContentAdmin, getAdminDb } from "@/lib/admin-auth"
import { isCourseProjectColumnError, projectFromCourseRow, saveCourseProject } from "@/lib/course-db"
import {
  resolveInstructorIdForCourseCreate,
  resolveOwnedInstructorIds,
  staffCanManageCourse,
} from "@/lib/instructor-identity"

export const dynamic = "force-dynamic"

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const COURSE_BASE_SELECT =
  "id, slug, title, description, category, instructor, price, level, duration, image, status, lessons_count, created_at, instructor_id"

const COURSE_PROJECT_SELECT =
  ", project_title, project_description, project_instructions, project_format"

async function fetchAdminCourses(auth: Exclude<Awaited<ReturnType<typeof requireContentAuth>>, { error: NextResponse }>) {
  const admin = getAdminDb()

  let ownedIds: string[] | null = null
  if (!isPlatformContentAdmin(auth) && auth.kind === "staff") {
    ownedIds = await resolveOwnedInstructorIds(admin, auth)
  }

  const buildQuery = (select: string) => {
    let query = admin.from("courses").select(select).order("created_at", { ascending: false })
    if (ownedIds?.length) {
      query = query.in("instructor_id", ownedIds)
    }
    return query.limit(500)
  }

  let { data, error } = await buildQuery(COURSE_BASE_SELECT + COURSE_PROJECT_SELECT)

  // Older DBs may not have project_* columns until migration is run.
  if (error && /project_/i.test(error.message)) {
    ;({ data, error } = await buildQuery(COURSE_BASE_SELECT))
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    courses: data || [],
    scope: isPlatformContentAdmin(auth) ? "all" : "owned",
  })
}

async function fetchSingleCourse(
  auth: Exclude<Awaited<ReturnType<typeof requireContentAuth>>, { error: NextResponse }>,
  courseId: string,
) {
  const admin = getAdminDb()

  const load = async (select: string) =>
    admin.from("courses").select(select).eq("id", courseId).maybeSingle()

  let { data, error } = await load(COURSE_BASE_SELECT + COURSE_PROJECT_SELECT)

  if (error && /project_/i.test(error.message)) {
    ;({ data, error } = await load(COURSE_BASE_SELECT))
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const { data: materials } = await admin
    .from("course_materials")
    .select("id, title, url, type, lesson_id")
    .eq("course_id", courseId)

  const project = projectFromCourseRow(data as Record<string, unknown>, materials || [])
  const course = {
    ...data,
    ...(project || {}),
  }

  if (!isPlatformContentAdmin(auth) && auth.kind === "staff") {
    const row = data as { instructor_id?: string | null }
    const allowed = await staffCanManageCourse(admin, auth, row.instructor_id)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.json({ course })
}

export async function GET(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const courseId = new URL(request.url).searchParams.get("id")
  if (courseId) return fetchSingleCourse(auth, courseId)

  return fetchAdminCourses(auth)
}

export async function POST(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const instructorId = await resolveInstructorIdForCourseCreate(admin, auth)
  const { data, error } = await admin
    .from("courses")
    .insert({
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      title,
      description: body.description || null,
      category: body.category || null,
      instructor:
        body.instructor ||
        (auth.kind === "staff" ? auth.profile.name : null) ||
        null,
      instructor_id: instructorId || (body.instructor_id as string) || null,
      price: Number(body.price) || 0,
      level: body.level || "Beginner",
      duration: body.duration || null,
      image: body.image || null,
      status: "draft",
    })
    .select("id, slug, title, status, price, category")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ course: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: { id?: string; status?: string; [key: string]: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: "Course id is required" }, { status: 400 })
  }

  const allowed = [
    "title",
    "description",
    "category",
    "instructor",
    "price",
    "level",
    "duration",
    "image",
    "status",
    "project_title",
    "project_description",
    "project_instructions",
    "project_format",
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const admin = getAdminDb()

  if (!isPlatformContentAdmin(auth)) {
    if (auth.kind !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data: owned } = await admin
      .from("courses")
      .select("instructor_id")
      .eq("id", body.id)
      .maybeSingle()
    const allowed = await staffCanManageCourse(admin, auth, owned?.instructor_id)
    if (!owned || !allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const projectFields = {
    project_title: updates.project_title,
    project_description: updates.project_description,
    project_instructions: updates.project_instructions,
    project_format: updates.project_format,
  }
  const hasProjectFields = Object.values(projectFields).some((v) => v !== undefined)

  let { error } = await admin.from("courses").update(updates).eq("id", body.id)

  if (error && isCourseProjectColumnError(error) && hasProjectFields) {
    const {
      project_title: _pt,
      project_description: _pd,
      project_instructions: _pi,
      project_format: _pf,
      ...nonProject
    } = updates

    if (Object.keys(nonProject).length > 0) {
      ;({ error } = await admin.from("courses").update(nonProject).eq("id", body.id))
    } else {
      error = null
    }

    if (!error) {
      const title =
        typeof projectFields.project_title === "string"
          ? projectFields.project_title.trim()
          : ""
      if (title) {
        await saveCourseProject(
          admin,
          body.id,
          {
            title,
            description:
              typeof projectFields.project_description === "string"
                ? projectFields.project_description
                : null,
            instructions:
              typeof projectFields.project_instructions === "string"
                ? projectFields.project_instructions
                : null,
            format:
              typeof projectFields.project_format === "string"
                ? projectFields.project_format
                : null,
          },
          false,
        )
      }
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Course id is required" }, { status: 400 })
  }

  const admin = getAdminDb()

  if (!isPlatformContentAdmin(auth)) {
    if (auth.kind !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { data: owned } = await admin
      .from("courses")
      .select("instructor_id")
      .eq("id", id)
      .maybeSingle()
    const allowed = await staffCanManageCourse(admin, auth, owned?.instructor_id)
    if (!owned || !allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const { error } = await admin.from("courses").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
