"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDashboardPathOptional } from "@/contexts/dashboard-path-context"
import { ArrowLeft, Loader2, Radio, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JitsiClassroom } from "@/components/live-classroom/jitsi-classroom"
import { useAuth } from "@/contexts/auth-context"

interface SessionPayload {
  session: {
    id: string
    title: string
    status: string
    room_name: string
    host_id: string
    scheduled_at: string
  }
  isHost: boolean
  jitsiDomain: string
}

export default function LiveClassroomRoomPage() {
  const params = useParams()
  const router = useRouter()
  const dashPath = useDashboardPathOptional()
  const { user } = useAuth()
  const sessionId =
    (params.id as string | undefined) ||
    dashPath?.path.match(/^\/dashboard\/live-classroom\/([^/]+)$/)?.[1] ||
    ""

  const [data, setData] = useState<SessionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/live-sessions/${sessionId}`)
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || "Unable to load classroom")
      setLoading(false)
      return
    }
    setData(json)
    setLoading(false)

    await fetch(`/api/live-sessions/${sessionId}/join`, { method: "POST" })
  }, [sessionId])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (status: "live" | "ended") => {
    await fetch(`/api/live-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-destructive">{error || "Session not found"}</p>
        <Link href="/dashboard/live-classroom">
          <Button variant="outline">Back to Live Classroom</Button>
        </Link>
      </div>
    )
  }

  const { session, isHost, jitsiDomain } = data

  return (
    <div className="space-y-4 -m-4 lg:-m-8">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-8 pt-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/live-classroom">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-lg">{session.title}</h1>
            <p className="text-xs text-muted-foreground">
              Nexus Live Classroom · {new Date(session.scheduled_at).toLocaleString()}
            </p>
          </div>
          <Badge variant={session.status === "live" ? "default" : "secondary"}>
            {session.status}
          </Badge>
        </div>

        {isHost && (
          <div className="flex gap-2">
            {session.status !== "live" && session.status !== "ended" && (
              <Button size="sm" className="gap-2" onClick={() => setStatus("live")}>
                <Radio className="h-4 w-4" />
                Go live
              </Button>
            )}
            {session.status === "live" && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setStatus("ended")}>
                <Square className="h-4 w-4" />
                End session
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="h-[calc(100vh-10rem)] min-h-[500px] px-4 lg:px-8 pb-4">
        <JitsiClassroom
          domain={jitsiDomain}
          roomName={session.room_name}
          displayName={user?.name || user?.email || "Participant"}
          email={user?.email}
          isHost={isHost}
          onLeave={() => router.push("/dashboard/live-classroom")}
        />
      </div>
    </div>
  )
}
