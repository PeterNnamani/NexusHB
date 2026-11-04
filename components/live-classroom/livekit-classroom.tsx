"use client"

import { useState } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react"
import { AlertCircle, Loader2 } from "lucide-react"

interface LiveKitClassroomProps {
  serverUrl: string
  token: string
  onLeave?: () => void
}

export function LiveKitClassroom({
  serverUrl,
  token,
  onLeave,
}: LiveKitClassroomProps) {
  const [mediaWarning, setMediaWarning] = useState<string | null>(null)

  return (
    <div className="relative h-full min-h-[480px] overflow-hidden rounded-xl bg-slate-950 text-white">
      {mediaWarning && (
        <div
          role="status"
          className="absolute left-3 right-3 top-3 z-20 flex items-center gap-2 rounded-lg bg-amber-950/90 p-3 text-sm text-amber-100"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {mediaWarning} You can allow access in your browser settings and reconnect.
        </div>
      )}
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        audio
        video
        className="lk-theme-dark h-full min-h-[480px]"
        onDisconnected={onLeave}
        onMediaDeviceFailure={(_failure, kind) => {
          setMediaWarning(
            kind === "audioinput"
              ? "Microphone access was denied or unavailable."
              : kind === "videoinput"
                ? "Camera access was denied or unavailable."
                : "A media device is unavailable.",
          )
        }}
        onError={(error) => {
          setMediaWarning(`Video connection failed: ${error.message}`)
        }}
      >
        <RoomAudioRenderer />
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}
