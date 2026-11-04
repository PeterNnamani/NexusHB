import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import {
  createLiveKitRoomService,
  createLiveSessionAdminClient,
} from "@/lib/livekit"
import { userCanHostLiveClassroom } from "@/lib/subscription-db"

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

  const admin = createLiveSessionAdminClient()
  const { data: session, error } = await admin
    .from("live_sessions")
    .select("id, host_id, course_id, lesson_id, title, description, room_name, status, scheduled_at, started_at, ended_at, failure_reason, duration_minutes, max_participants, waiting_room, eligible_audience, courses(title)")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  const isHost = session.host_id === user.id
  const isAdmin = profile?.role === "admin"
  let isEnrolled = false
  if (session.course_id && !isHost && !isAdmin) {
    const { data: enrollment, error: enrollmentError } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", session.course_id)
      .in("status", ["active", "completed"])
      .maybeSingle()
    if (enrollmentError) {
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 })
    }
    isEnrolled = !!enrollment
  }

  if (!isHost && !isAdmin && !isEnrolled) {
    return NextResponse.json({ error: "You are not enrolled in this live class" }, { status: 403 })
  }

  const { data: participants, error: participantError } = await admin
    .from("live_session_participants")
    .select("user_id, role, status, joined_at, left_at, connected_seconds")
    .eq("session_id", id)
  if (participantError) {
    return NextResponse.json({ error: participantError.message }, { status: 500 })
  }

  return NextResponse.json({
    session,
    isHost,
    isAdmin,
    participants: isHost || isAdmin ? participants || [] : [],
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

  let body: { status?: string; failureReason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const status = body.status
  if (!status || !["live", "ended", "cancelled", "failed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
  }
  if (body.failureReason !== undefined && typeof body.failureReason !== "string") {
    return NextResponse.json({ error: "Failure reason must be text" }, { status: 400 })
  }

  const admin = createLiveSessionAdminClient()
  const { data: current, error: currentError } = await admin
    .from("live_sessions")
    .select("id, host_id, room_name, max_participants, failure_reason, status")
    .eq("id", id)
    .maybeSingle()
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 })
  if (!current) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  if (current.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can manage this session" }, { status: 403 })
  }
  if (status === "live") {
    const { data: hostProfile, error: hostProfileError } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (hostProfileError) {
      return NextResponse.json({ error: hostProfileError.message }, { status: 500 })
    }
    if (!(await userCanHostLiveClassroom(user.id, hostProfile?.role, supabase))) {
      return NextResponse.json({ error: "Your account no longer has Live Classroom hosting access" }, { status: 403 })
    }
  }

  const allowed =
    (status === "live" && current.status === "scheduled") ||
    (status === "ended" && current.status === "live") ||
    (status === "ended" && current.status === "ended") ||
    (status === "failed" && ["scheduled", "live", "failed"].includes(current.status)) ||
    (status === "cancelled" && current.status === "scheduled")
  if (!allowed) {
    return NextResponse.json(
      { error: `Cannot change session from ${current.status} to ${status}` },
      { status: 409 },
    )
  }

  if (status === "live") {
    try {
      await createLiveKitRoomService().createRoom({
        name: current.room_name,
        emptyTimeout: 600,
        departureTimeout: 300,
        maxParticipants: current.max_participants,
      })
    } catch (error) {
      console.error("[live-session] LiveKit room creation failed", error)
      return NextResponse.json({ error: "Unable to start the video room" }, { status: 502 })
    }
  }

  const now = new Date().toISOString()
  const updates: Record<string, string> = { status, updated_at: now }
  const transitioned = current.status !== status
  if (status === "live") updates.started_at = now
  if ((status === "ended" || status === "cancelled" || status === "failed") && transitioned) {
    updates.ended_at = now
  }
  if (status === "failed" && transitioned) {
    updates.failure_reason = body.failureReason?.trim().slice(0, 500) || "Marked failed by the tutor"
  }
  const { data, error } = await admin
    .from("live_sessions")
    .update(updates)
    .eq("id", id)
    .eq("status", current.status)
    .select("id, status, started_at, ended_at")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Session changed; refresh and try again" }, { status: 409 })

  if (transitioned) {
    const { error: eventError } = await admin.from("session_events").insert({
      session_id: id,
      actor_id: user.id,
      event_type: status === "live" ? "session_started" : `session_${status}`,
      metadata: status === "failed"
        ? { reason: updates.failure_reason || current.failure_reason }
        : {},
    })
    if (eventError) console.error("[live-session] Failed to record lifecycle event", eventError)
  }

  if (status === "ended" || status === "failed") {
    try {
      const roomService = createLiveKitRoomService()
      const rooms = await roomService.listRooms([current.room_name])
      if (rooms.length) await roomService.deleteRoom(current.room_name)
    } catch (error) {
      console.error("[live-session] LiveKit room cleanup failed", error)
      return NextResponse.json(
        { error: "The class ended, but its media room could not be closed. Retry ending the class." },
        { status: 502 },
      )
    }
  }

  if (status === "ended" || status === "failed" || status === "cancelled") {
    const { error: notificationError } = await admin
      .from("events")
      .delete()
      .eq("live_session_id", id)
    if (notificationError) {
      console.error("[live-session] Failed to clear scheduled notifications", notificationError)
    }
  }

  return NextResponse.json({ session: data })
}
