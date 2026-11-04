import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import {
  createLiveKitToken,
  createLiveSessionAdminClient,
} from "@/lib/livekit"
import { userCanHostLiveClassroom } from "@/lib/subscription-db"

export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createLiveSessionAdminClient()
  const { data: session, error: sessionError } = await admin
    .from("live_sessions")
    .select("id, host_id, room_name, status")
    .eq("id", id)
    .maybeSingle()
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  if (session.host_id !== user.id) {
    return NextResponse.json({ error: "Only the tutor can request a host token" }, { status: 403 })
  }
  if (session.status !== "live") {
    return NextResponse.json({ error: "Start the class before joining the room" }, { status: 409 })
  }

  const { data: hostProfile, error: profileError } = await admin
    .from("users")
    .select("role, name, email")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!(await userCanHostLiveClassroom(user.id, hostProfile?.role, supabase))) {
    return NextResponse.json({ error: "Your account no longer has Live Classroom hosting access" }, { status: 403 })
  }

  const { data: accessStatus, error: accessError } = await admin.rpc(
    "request_live_session_access",
    { requested_session_id: id, requested_user_id: user.id, requested_role: "tutor" },
  )
  if (accessError) {
    console.error("[live-session token] Host access reservation failed", accessError)
    return NextResponse.json({ error: "Unable to reserve a place in this class" }, { status: 503 })
  }
  if (accessStatus !== "invited" && accessStatus !== "joined") {
    return NextResponse.json({ error: "Unable to join this class" }, { status: 409 })
  }

  try {
    const result = await createLiveKitToken({
      identity: user.id,
      name: hostProfile?.name || hostProfile?.email || user.email || "Tutor",
      roomName: session.room_name,
      role: "tutor",
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[live-session token] Token issuance failed", error)
    return NextResponse.json({ error: "Unable to issue a classroom token" }, { status: 503 })
  }
}