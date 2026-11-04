import { NextRequest, NextResponse } from "next/server"
import { WebhookReceiver } from "livekit-server-sdk"
import {
  createLiveSessionAdminClient,
  getLiveKitConfig,
} from "@/lib/livekit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!authorization) {
    return NextResponse.json({ error: "Missing webhook authorization" }, { status: 401 })
  }

  let config: ReturnType<typeof getLiveKitConfig>
  try {
    config = getLiveKitConfig()
  } catch (error) {
    console.error("[live-session webhook] LiveKit is not configured", error)
    return NextResponse.json({ error: "LiveKit webhook configuration is unavailable" }, { status: 503 })
  }

  let event
  try {
    const rawBody = await request.text()
    event = await new WebhookReceiver(config.apiKey, config.apiSecret).receive(
      rawBody,
      authorization,
    )
  } catch (error) {
    console.error("[live-session webhook] Signature validation failed", error)
    return NextResponse.json({ error: "Invalid webhook signature or payload" }, { status: 401 })
  }

  if (!event.room?.name || !event.id) {
    return NextResponse.json({ error: "Webhook event is missing room or event identity" }, { status: 400 })
  }

  const admin = createLiveSessionAdminClient()
  const { data: session, error: sessionError } = await admin
    .from("live_sessions")
    .select("id")
    .eq("room_name", event.room.name)
    .maybeSingle()
  if (sessionError) {
    console.error("[live-session webhook] Session lookup failed", sessionError)
    return NextResponse.json({ error: "Unable to resolve classroom session" }, { status: 500 })
  }
  if (!session) return NextResponse.json({ received: true, ignored: true })

  const occurredAt = new Date(Number(event.createdAt) * 1000)
  const actorId = event.participant?.identity || null
  const { error } = await admin.rpc("record_live_session_event", {
    requested_session_id: session.id,
    requested_event_id: event.id,
    requested_event_type: event.event,
    requested_actor_id: actorId,
    requested_occurred_at: Number.isFinite(occurredAt.getTime())
      ? occurredAt.toISOString()
      : new Date().toISOString(),
    requested_metadata: {
      participant_sid: event.participant?.sid || null,
      room_name: event.room.name,
    },
  })
  if (error) {
    console.error("[live-session webhook] Event recording failed", error)
    return NextResponse.json({ error: "Unable to record classroom event" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}