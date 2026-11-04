import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import {
  createLiveKitToken,
  createLiveSessionAdminClient,
} from "@/lib/livekit"
import { userCanJoinLiveClassroom } from "@/lib/subscription-db"

export const dynamic = "force-dynamic"

export async function POST(
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
  const [{ data: session, error: sessionError }, { data: profile, error: profileError }] =
    await Promise.all([
      admin
        .from("live_sessions")
        .select("id, host_id, course_id, room_name, status")
        .eq("id", id)
        .maybeSingle(),
      admin.from("users").select("role, name, email").eq("id", user.id).maybeSingle(),
    ])
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  if (session.host_id === user.id) {
    return NextResponse.json({ error: "Tutors must use the host token endpoint" }, { status: 400 })
  }
  if (session.status !== "live") {
    return NextResponse.json({ error: "This class is not live" }, { status: 409 })
  }
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "Only enrolled students can join this classroom" }, { status: 403 })
  }
  if (!session.course_id) {
    return NextResponse.json({ error: "This class has no eligible course audience" }, { status: 403 })
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", session.course_id)
    .in("status", ["active", "completed"])
    .maybeSingle()
  if (enrollmentError) return NextResponse.json({ error: enrollmentError.message }, { status: 500 })
  if (!enrollment) return NextResponse.json({ error: "Active course enrollment is required" }, { status: 403 })

  if (!(await userCanJoinLiveClassroom(user.id, profile.role, supabase))) {
    return NextResponse.json(
      { error: "Your current plan does not include Live Classroom access", upgradeUrl: "/dashboard/upgrade" },
      { status: 403 },
    )
  }

  const { data: accessStatus, error: accessError } = await admin.rpc(
    "request_live_session_access",
    { requested_session_id: id, requested_user_id: user.id, requested_role: "student" },
  )
  if (accessError) {
    if (accessError.message.includes("participant_removed")) {
      return NextResponse.json({ error: "You were removed from this class; ask the tutor to re-admit you" }, { status: 403 })
    }
    if (accessError.message.includes("session_full")) {
      return NextResponse.json({ error: "This class has reached its participant limit" }, { status: 409 })
    }
    if (accessError.message.includes("session_not_live")) {
      return NextResponse.json({ error: "This class is no longer live" }, { status: 409 })
    }
    console.error("[live-session join] Access reservation failed", accessError)
    return NextResponse.json({ error: "Unable to join this class" }, { status: 503 })
  }

  if (accessStatus === "waiting") {
    return NextResponse.json({ status: "waiting" })
  }
  if (accessStatus !== "invited" && accessStatus !== "joined") {
    return NextResponse.json({ error: "Unable to join this class" }, { status: 409 })
  }

  try {
    const result = await createLiveKitToken({
      identity: user.id,
      name: profile.name || profile.email || user.email || "Student",
      roomName: session.room_name,
      role: "student",
    })
    const [{ data: participant, error: participantError }, { data: latestSession, error: latestSessionError }] =
      await Promise.all([
        admin
          .from("live_session_participants")
          .select("status")
          .eq("session_id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
        admin.from("live_sessions").select("status").eq("id", id).maybeSingle(),
      ])
    if (participantError) {
      console.error("[live-session join] Participant status check failed", participantError)
      return NextResponse.json({ error: "Unable to confirm classroom admission" }, { status: 503 })
    }
    if (latestSessionError) {
      console.error("[live-session join] Session status check failed", latestSessionError)
      return NextResponse.json({ error: "Unable to confirm classroom status" }, { status: 503 })
    }
    if (latestSession?.status !== "live") {
      return NextResponse.json({ error: "This class is no longer live" }, { status: 409 })
    }
    if (!participant || participant.status === "removed") {
      return NextResponse.json({ error: "You were removed from this class; ask the tutor to re-admit you" }, { status: 403 })
    }
    return NextResponse.json({ status: "admitted", ...result })
  } catch (error) {
    console.error("[live-session join] Token issuance failed", error)
    return NextResponse.json({ error: "Unable to issue a classroom token" }, { status: 503 })
  }
}
