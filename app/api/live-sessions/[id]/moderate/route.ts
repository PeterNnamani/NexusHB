import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import {
  createLiveKitRoomService,
  createLiveSessionAdminClient,
} from "@/lib/livekit"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

async function authorizeHost(id: string) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const admin = createLiveSessionAdminClient()
  const { data: session, error } = await admin
    .from("live_sessions")
    .select("id, host_id, room_name, status")
    .eq("id", id)
    .maybeSingle()
  if (error) return { response: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!session) return { response: NextResponse.json({ error: "Session not found" }, { status: 404 }) }
  if (session.host_id !== user.id) {
    return { response: NextResponse.json({ error: "Only the tutor can moderate this class" }, { status: 403 }) }
  }
  if (session.status !== "live") {
    return { response: NextResponse.json({ error: "This class is not live" }, { status: 409 }) }
  }
  return { admin, session, user }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const auth = await authorizeHost(id)
  if ("response" in auth) return auth.response

  const { data, error } = await auth.admin
    .from("live_session_participants")
    .select("user_id, role, status, joined_at, left_at, connected_seconds")
    .eq("session_id", id)
    .order("created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((data || []).map((participant) => participant.user_id))]
  const { data: users, error: usersError } = await auth.admin
    .from("users")
    .select("id, name, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })
  const usersById = new Map((users || []).map((user) => [user.id, user]))

  return NextResponse.json({
    participants: (data || []).map((participant) => ({
      ...participant,
      name: usersById.get(participant.user_id)?.name ||
        usersById.get(participant.user_id)?.email ||
        "Participant",
    })),
  })
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const auth = await authorizeHost(id)
  if ("response" in auth) return auth.response

  let body: { action?: string; participantId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  if (!body.participantId || !["admit", "remove"].includes(body.action || "")) {
    return NextResponse.json({ error: "A participant and valid action are required" }, { status: 400 })
  }

  const { data: participant, error: participantError } = await auth.admin
    .from("live_session_participants")
    .select("user_id, role, status")
    .eq("session_id", id)
    .eq("user_id", body.participantId)
    .maybeSingle()
  if (participantError) return NextResponse.json({ error: participantError.message }, { status: 500 })
  if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 })
  if (participant.role === "tutor") {
    return NextResponse.json({ error: "The host cannot be moderated" }, { status: 400 })
  }

  if (body.action === "admit") {
    if (participant.status !== "waiting") {
      return NextResponse.json({ error: "Participant is not waiting for admission" }, { status: 409 })
    }
    const { data: admitted, error } = await auth.admin.rpc(
      "admit_live_session_participant",
      { requested_session_id: id, requested_user_id: participant.user_id },
    )
    if (error) {
      if (error.message.includes("session_full")) {
        return NextResponse.json({ error: "This class has reached its participant limit" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!admitted) return NextResponse.json({ error: "Participant is no longer waiting" }, { status: 409 })
  } else {
    if (participant.status !== "waiting") {
      try {
        const roomService = createLiveKitRoomService()
        await roomService.removeParticipant(auth.session.room_name, participant.user_id, {
          revokeTokenTs: BigInt(Math.floor(Date.now() / 1000)),
        })
      } catch (error) {
        console.error("[live-session moderation] Failed to revoke participant access", error)
        return NextResponse.json({ error: "Unable to revoke participant access from the media room" }, { status: 502 })
      }
    }

    const { data: removed, error } = await auth.admin.rpc("remove_live_session_participant", {
      requested_session_id: id,
      requested_user_id: participant.user_id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!removed) return NextResponse.json({ error: "Participant could not be removed from this session" }, { status: 409 })
  }

  const { error: eventError } = await auth.admin.from("session_events").insert({
    session_id: id,
    actor_id: auth.user.id,
    event_type: body.action === "admit" ? "participant_admitted" : "participant_removed",
    metadata: { participant_id: participant.user_id },
  })
  if (eventError) console.error("[live-session moderation] Failed to record event", eventError)

  return NextResponse.json({ success: true })
}