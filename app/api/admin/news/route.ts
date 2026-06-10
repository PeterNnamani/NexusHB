import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  const auth = await requirePlatformAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("news")
    .select("id, title, category, published, published_at, excerpt, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ news: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
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
  const { data, error } = await admin
    .from("news")
    .insert({
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      title,
      excerpt: body.excerpt || null,
      content: body.content || null,
      category: body.category || null,
      image: body.image || null,
      author: (typeof body.author === "string" ? body.author : null) || auth.session.email,
      published: body.published !== false,
      published_at: new Date().toISOString(),
    })
    .select("id, title, published")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ article: data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if ("error" in auth) return auth.error

  let body: { id?: string; published?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: "Article id is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const updates: Record<string, unknown> = {}
  if (typeof body.published === "boolean") {
    updates.published = body.published
    if (body.published) updates.published_at = new Date().toISOString()
  }

  const { error } = await admin.from("news").update(updates).eq("id", body.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if ("error" in auth) return auth.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Article id is required" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { error } = await admin.from("news").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
