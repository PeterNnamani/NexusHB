import { NextRequest, NextResponse } from "next/server"
import { requireContentAuth, getAdminDb } from "@/lib/admin-auth"
import { encodeDocumentMaterial } from "@/lib/format-material"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const courseId = new URL(request.url).searchParams.get("courseId")
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("course_materials")
    .select("id, title, url, type, lesson_id")
    .eq("course_id", courseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ materials: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: {
    courseId?: string
    lessonId?: string
    title?: string
    url?: string
    content?: string
    type?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.courseId || !body.title?.trim()) {
    return NextResponse.json({ error: "courseId and title are required" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  const url = typeof body.url === "string" ? body.url.trim() : ""

  if (!content && !url) {
    return NextResponse.json({ error: "Provide content (text) or url (link)" }, { status: 400 })
  }

  const finalUrl = content ? encodeDocumentMaterial(content) : url
  const type = content ? "document" : body.type || "link"

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("course_materials")
    .insert({
      course_id: body.courseId,
      lesson_id: body.lessonId?.trim() || null,
      title: body.title.trim(),
      url: finalUrl,
      type,
    })
    .select("id, title, url, type")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ material: data })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Material id is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { error } = await admin.from("course_materials").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
