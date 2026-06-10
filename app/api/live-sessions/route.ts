import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { userCanHostLiveClassroom } from "@/lib/subscription-db"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("live_sessions")
    .select("id, title, description, room_name, status, scheduled_at, duration_minutes, course_id, host_id, courses(title)")
    .order("scheduled_at", { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const canHost = await userCanHostLiveClassroom(user.id, profile?.role, supabase)
  if (!canHost) {
    return NextResponse.json(
      {
        error: "Live Classroom requires Tutor Plus or Agent plan",
        upgradeUrl: "/dashboard/upgrade",
      },
      { status: 403 },
    )
  }

  let body: {
    title?: string
    description?: string
    courseId?: string
    scheduledAt?: string
    durationMinutes?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!body.title?.trim() || !body.scheduledAt) {
    return NextResponse.json({ error: "Title and scheduled time are required" }, { status: 400 })
  }

  const roomName = `nexus-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })

  const { data: session, error } = await admin
    .from("live_sessions")
    .insert({
      host_id: user.id,
      course_id: body.courseId || null,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      room_name: roomName,
      scheduled_at: body.scheduledAt,
      duration_minutes: body.durationMinutes || 60,
      status: "scheduled",
    })
    .select("id, title, room_name, scheduled_at, status")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.courseId) {
    await admin.from("events").insert({
      user_id: user.id,
      course_id: body.courseId,
      title: body.title.trim(),
      description: body.description?.trim() || "Nexus Live Classroom session",
      type: "live",
      start_at: body.scheduledAt,
      end_at: new Date(
        new Date(body.scheduledAt).getTime() + (body.durationMinutes || 60) * 60000,
      ).toISOString(),
    })
  }

  return NextResponse.json({ session })
}
