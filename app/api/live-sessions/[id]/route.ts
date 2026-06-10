import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: session, error } = await supabase
    .from("live_sessions")
    .select("*, courses(title)")
    .eq("id", id)
    .maybeSingle()

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const isHost = session.host_id === user.id
  let canJoin = isHost

  if (!canJoin) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (["admin", "tutor"].includes(profile?.role || "")) {
      canJoin = true
    }
  }

  if (!canJoin && session.course_id) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", session.course_id)
      .maybeSingle()
    canJoin = !!enrollment
  }

  if (!canJoin) {
    return NextResponse.json({ error: "You are not enrolled in this live class" }, { status: 403 })
  }

  return NextResponse.json({
    session,
    isHost,
    jitsiDomain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si",
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const status = body.status as string | undefined

  if (!status || !["live", "ended", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })

  const updates: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (status === "live") updates.started_at = new Date().toISOString()
  if (status === "ended") updates.ended_at = new Date().toISOString()

  const { data, error } = await admin
    .from("live_sessions")
    .update(updates)
    .eq("id", id)
    .eq("host_id", user.id)
    .select("id, status")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Unable to update session" }, { status: 403 })
  }

  return NextResponse.json({ session: data })
}
