"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => {
      dispose: () => void
      executeCommand: (cmd: string, ...args: unknown[]) => void
      addListener: (event: string, handler: () => void) => void
    }
  }
}

interface JitsiClassroomProps {
  domain: string
  roomName: string
  displayName: string
  email?: string
  isHost?: boolean
  onLeave?: () => void
}

export function JitsiClassroom({
  domain,
  roomName,
  displayName,
  email,
  isHost = false,
  onLeave,
}: JitsiClassroomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<{ dispose: () => void } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!containerRef.current) return

      if (!window.JitsiMeetExternalAPI) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[data-jitsi="true"]')
          if (existing) {
            existing.addEventListener("load", () => resolve())
            return
          }
          const script = document.createElement("script")
          script.src = `https://${domain}/external_api.js`
          script.async = true
          script.dataset.jitsi = "true"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load classroom engine"))
          document.body.appendChild(script)
        })
      }

      if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return

      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
          email: email || undefined,
        },
        configOverwrite: {
          startWithAudioMuted: !isHost,
          startWithVideoMuted: false,
          prejoinPageEnabled: true,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: "#0f172a",
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "chat",
            "raisehand",
            "tileview",
            "settings",
          ],
        },
      })

      api.addListener("videoConferenceLeft", () => {
        onLeave?.()
      })

      apiRef.current = api
      setLoading(false)
    }

    init().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to start classroom")
      setLoading(false)
    })

    return () => {
      cancelled = true
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [domain, roomName, displayName, email, isHost, onLeave])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full min-h-[480px] rounded-xl overflow-hidden bg-slate-950">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Starting Nexus Live Classroom…</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full min-h-[480px]" />
    </div>
  )
}
