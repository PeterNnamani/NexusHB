import "server-only"
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { createClient } from "@supabase/supabase-js"

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

export function getLiveKitConfig() {
  const rawUrl = required("LIVEKIT_URL", process.env.LIVEKIT_URL)
  const url = new URL(rawUrl)
  const serverUrl =
    url.protocol === "wss:"
      ? `https:${rawUrl.slice(rawUrl.indexOf(":") + 1)}`
      : rawUrl

  if (!["https:", "http:"].includes(new URL(serverUrl).protocol)) {
    throw new Error("LIVEKIT_URL must use https:// or wss://")
  }

  return {
    serverUrl,
    clientUrl: serverUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:"),
    apiKey: required("LIVEKIT_API_KEY", process.env.LIVEKIT_API_KEY),
    apiSecret: required("LIVEKIT_API_SECRET", process.env.LIVEKIT_API_SECRET),
  }
}

export function createLiveKitRoomService() {
  const config = getLiveKitConfig()
  return new RoomServiceClient(config.serverUrl, config.apiKey, config.apiSecret)
}

export async function createLiveKitToken({
  identity,
  name,
  roomName,
  role,
}: {
  identity: string
  name: string
  roomName: string
  role: "tutor" | "student"
}) {
  const config = getLiveKitConfig()
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity,
    name,
    ttl: "2m",
    metadata: JSON.stringify({ role }),
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canPublishSources:
      role === "tutor"
        ? [
            TrackSource.MICROPHONE,
            TrackSource.CAMERA,
            TrackSource.SCREEN_SHARE,
            TrackSource.SCREEN_SHARE_AUDIO,
          ]
        : [TrackSource.MICROPHONE, TrackSource.CAMERA],
    canSubscribe: true,
    canPublishData: true,
  })

  return { token: await token.toJwt(), serverUrl: config.clientUrl }
}

export function createLiveSessionAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })
}
