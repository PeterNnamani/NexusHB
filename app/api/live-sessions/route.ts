import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { createLiveSessionAdminClient } from "@/lib/livekit"
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

  const admin = createLiveSessionAdminClient()
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  const isStaff = ["admin", "tutor"].includes(profile?.role || "")
  const { data: enrollments, error: enrollmentError } = isStaff
    ? { data: [], error: null }
    : await admin
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .in("status", ["active", "completed"])

  if (enrollmentError) {
    return NextResponse.json({ error: enrollmentError.message }, { status: 500 })
  }

  let query = admin
    .from("live_sessions")
    .select("id, title, description, status, scheduled_at, duration_minutes, course_id, lesson_id, host_id, waiting_room, courses(title)")
    .order("scheduled_at", { ascending: true })
    .limit(100)

  if (profile?.role === "admin") {
    // Administrators can view all classroom sessions.
  } else if (profile?.role === "tutor") {
    query = query.eq("host_id", user.id)
  } else {
    const courseIds = (enrollments || []).map((enrollment) => enrollment.course_id)
    if (!courseIds.length) return NextResponse.json({ sessions: [] })
    query = query.in("course_id", courseIds)
  }

  const { data, error } = await query
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

  const admin = createLiveSessionAdminClient()
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!["admin", "tutor"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "Only tutors can schedule live classes" }, { status: 403 })
  }

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
    lessonId?: string
    scheduledAt?: string
    durationMinutes?: number
    waitingRoom?: boolean
    maxParticipants?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const title = body.title?.trim()
  const courseId = body.courseId?.trim()
  const lessonId = body.lessonId?.trim()
  if (body.description !== undefined && typeof body.description !== "string") {
    return NextResponse.json({ error: "Description must be text" }, { status: 400 })
  }
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
  const durationMinutes = Number(body.durationMinutes)
  const maxParticipants = Number(body.maxParticipants ?? 50)

  if (!title || title.length > 160 || !courseId || !scheduledAt || !Number.isFinite(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "A valid title, course and scheduled time are required" },
      { status: 400 },
    )
  }
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 })
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
    return NextResponse.json({ error: "Duration must be between 15 and 240 minutes" }, { status: 400 })
  }
  if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 500) {
    return NextResponse.json({ error: "Capacity must be between 2 and 500 participants" }, { status: 400 })
  }

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, instructor_id, title")
    .eq("id", courseId)
    .maybeSingle()
  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 })
  }
  if (!course || (profile?.role !== "admin" && course.instructor_id !== user.id)) {
    return NextResponse.json({ error: "You cannot schedule a class for this course" }, { status: 403 })
  }

  if (lessonId) {
    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .maybeSingle()
    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 500 })
    }
    if (!lesson) {
      return NextResponse.json({ error: "Lesson does not belong to the selected course" }, { status: 400 })
    }
  }

  const roomName = `nexus-${crypto.randomUUID().replace(/-/g, "")}`
  const { data: session, error } = await admin.from("live_sessions").insert({
      host_id: user.id,
      course_id: courseId,
      lesson_id: lessonId || null,
      title,
      description: body.description?.trim() || null,
      room_name: roomName,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: durationMinutes,
      max_participants: maxParticipants,
      waiting_room: body.waitingRoom !== false,
      eligible_audience: "course_enrolled",
      status: "scheduled",
    })
    .select("id, title, room_name, scheduled_at, status")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: eventError } = await admin.from("session_events").insert({
    session_id: session.id,
    actor_id: user.id,
    event_type: "session_scheduled",
    metadata: { course_id: courseId, lesson_id: lessonId || null },
  })
  if (eventError) console.error("[live-sessions] Failed to record schedule event", eventError)

  const { data: enrollments, error: enrollmentError } = await admin
    .from("enrollments")
    .select("user_id")
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
  if (enrollmentError) {
    console.error("[live-sessions] Failed to load notification audience", enrollmentError)
    return NextResponse.json({ session, notificationWarning: true })
  }

  const studentIds = [...new Set((enrollments || []).map((enrollment) => enrollment.user_id))]
  const audienceIds = [...new Set([user.id, ...studentIds])]
  const { data: recipients, error: recipientError } = await admin
    .from("users")
    .select("id, notification_prefs")
    .in("id", audienceIds)
  if (recipientError) {
    console.error("[live-sessions] Failed to load notification preferences", recipientError)
    return NextResponse.json({ session, notificationWarning: true })
  }

  const notificationRows = (recipients || [])
    .filter((recipient) => {
      const prefs = recipient.notification_prefs
      return !prefs || typeof prefs !== "object" || Array.isArray(prefs) ||
        (prefs as Record<string, unknown>).liveClassNotifications !== false
    })
    .map((recipient) => ({
      user_id: recipient.id,
      live_session_id: session.id,
      course_id: courseId,
      title: `Live class scheduled: ${title}`,
      description: `${course.title} · ${scheduledAt.toLocaleString()}`,
      type: "live",
      start_at: scheduledAt.toISOString(),
      end_at: new Date(scheduledAt.getTime() + durationMinutes * 60_000).toISOString(),
    }))

  if (notificationRows.length) {
    const { error: notificationError } = await admin.from("events").insert(notificationRows)
    if (notificationError) {
      console.error("[live-sessions] Failed to create in-app schedule notifications", notificationError)
      return NextResponse.json({ session, notificationWarning: true })
    }
  }

  return NextResponse.json({ session })
}
