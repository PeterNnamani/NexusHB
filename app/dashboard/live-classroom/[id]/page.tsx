"use client"

import "@livekit/components-styles"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useDashboardPathOptional } from "@/contexts/dashboard-path-context"
import { ArrowLeft, Loader2, Radio, Square, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LiveKitClassroom } from "@/components/live-classroom/livekit-classroom"

interface Participant {
  user_id: string
  role: "tutor" | "student"
  status: "invited" | "waiting" | "joined" | "left" | "removed"
  joined_at: string | null
  connected_seconds: number
  name: string
}

interface SessionPayload {
  session: {
    id: string
    title: string
    course_id: string | null
    status: "scheduled" | "live" | "ended" | "cancelled" | "failed"
    host_id: string
    scheduled_at: string
    started_at: string | null
    ended_at: string | null
    failure_reason: string | null
    duration_minutes: number
    waiting_room: boolean
    courses?: { title: string } | null
  }
  isHost: boolean
  isAdmin: boolean
}

interface RoomCredentials {
  serverUrl: string
  token: string
}

export default function LiveClassroomRoomPage() {
  const params = useParams()
  const dashPath = useDashboardPathOptional()
  const sessionId =
    (params.id as string | undefined) ||
    dashPath?.path.match(/^\/dashboard\/live-classroom\/([^/]+)$/)?.[1] ||
    ""

  const [data, setData] = useState<SessionPayload | null>(null)
  const [credentials, setCredentials] = useState<RoomCredentials | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [waiting, setWaiting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const joinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadSession = useCallback(async () => {
    const response = await fetch(`/api/live-sessions/${sessionId}`, { cache: "no-store" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Unable to load classroom")
    setData(result)
    return result as SessionPayload
  }, [sessionId])

  const getHostToken = useCallback(async () => {
    const response = await fetch(`/api/live-sessions/${sessionId}/token`, { method: "POST" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Unable to connect to the classroom")
    setCredentials(result)
    setWaiting(false)
  }, [sessionId])

  const requestStudentJoin = useCallback(async () => {
    const response = await fetch(`/api/live-sessions/${sessionId}/join`, { method: "POST" })
    const result = await response.json()
    if (response.status === 202 || result.status === "waiting") {
      setWaiting(true)
      setCredentials(null)
      joinTimer.current = setTimeout(() => {
        requestStudentJoin().catch((joinError) => {
          setRoomError(joinError instanceof Error ? joinError.message : "Unable to join this classroom")
        })
      }, 4000)
      return
    }
    if (!response.ok) {
      throw new Error(result.error || "Unable to join this classroom")
    }
    setWaiting(false)
    setCredentials({ token: result.token, serverUrl: result.serverUrl })
  }, [sessionId])

  const refreshParticipants = useCallback(async () => {
    const response = await fetch(`/api/live-sessions/${sessionId}/moderate`, { cache: "no-store" })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(result.error || "Unable to load participants")
    }
    const result = await response.json()
    setParticipants(result.participants || [])
  }, [sessionId])

  useEffect(() => {
    let active = true
    loadSession()
      .then(async (result) => {
        if (!active || result.session.status !== "live") return
        try {
          if (result.isHost) await getHostToken()
          else await requestStudentJoin()
        } catch (connectionError) {
          if (active) {
            setRoomError(
              connectionError instanceof Error
                ? connectionError.message
                : "Unable to connect to the classroom",
            )
          }
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load classroom")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (joinTimer.current) clearTimeout(joinTimer.current)
    }
  }, [getHostToken, loadSession, requestStudentJoin])

  useEffect(() => {
    if (!data?.isHost || data.session.status !== "live") return
    const refresh = () => {
      refreshParticipants().catch((refreshError) => {
        setRoomError(refreshError instanceof Error ? refreshError.message : "Unable to load participants")
      })
    }
    refresh()
    const interval = setInterval(refresh, 4000)
    return () => clearInterval(interval)
  }, [data?.isHost, data?.session.status, refreshParticipants])

  const updateSessionStatus = async (status: "live" | "ended" | "cancelled" | "failed") => {
    setWorking(true)
    setRoomError(null)
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to update class")
      setData((current) => current ? { ...current, session: { ...current.session, ...result.session } } : current)
      if (status === "live") {
        await getHostToken()
      } else {
        setCredentials(null)
        setWaiting(false)
      }
    } catch (actionError) {
      setRoomError(actionError instanceof Error ? actionError.message : "Unable to update class")
    } finally {
      setWorking(false)
    }
  }

  const moderate = async (participantId: string, action: "admit" | "remove") => {
    setRoomError(null)
    try {
      const response = await fetch(`/api/live-sessions/${sessionId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, action }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to moderate participant")
      await refreshParticipants()
    } catch (actionError) {
      setRoomError(actionError instanceof Error ? actionError.message : "Unable to moderate participant")
    }
  }

  const retryConnection = async () => {
    setRoomError(null)
    setWorking(true)
    try {
      if (isHost) await getHostToken()
      else await requestStudentJoin()
    } catch (retryError) {
      setRoomError(retryError instanceof Error ? retryError.message : "Unable to reconnect")
    } finally {
      setWorking(false)
    }
  }

  useEffect(() => {
    if (data?.session.status !== "live") return
    const interval = setInterval(() => {
      loadSession()
        .then((result) => {
          if (result.session.status !== "live") {
            setCredentials(null)
            setWaiting(false)
          }
        })
        .catch((pollError) => {
          setRoomError(pollError instanceof Error ? pollError.message : "Unable to refresh class status")
        })
    }, 8000)
    return () => clearInterval(interval)
  }, [data?.session.status, loadSession])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-destructive">{error || "Session not found"}</p>
        <Link href="/dashboard/live-classroom">
          <Button variant="outline">Back to Live Classroom</Button>
        </Link>
      </div>
    )
  }

  const { session, isHost } = data
  const isFinished = ["ended", "cancelled", "failed"].includes(session.status)

  return (
    <div className="space-y-4 -m-4 lg:-m-8">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 pt-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/live-classroom">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{session.title}</h1>
            <p className="text-xs text-muted-foreground">
              {session.courses?.title || "Nexus Live Classroom"} ·{" "}
              {new Date(session.scheduled_at).toLocaleString()}
            </p>
          </div>
          <Badge variant={session.status === "live" ? "default" : "secondary"}>
            {session.status}
          </Badge>
        </div>

        {isHost && session.status === "scheduled" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={() => updateSessionStatus("cancelled")}
            >
              Cancel class
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={working}
              onClick={() => updateSessionStatus("live")}
            >
              <Radio className="h-4 w-4" />
              Start class
            </Button>
          </div>
        )}
        {isHost && session.status === "live" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={working}
            onClick={() => updateSessionStatus("ended")}
          >
            <Square className="h-4 w-4" />
            End class
          </Button>
        )}
        {isHost && (session.status === "ended" || session.status === "failed") && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={working}
            onClick={() => updateSessionStatus(session.status === "failed" ? "failed" : "ended")}
          >
            <Square className="h-4 w-4" />
            Retry room shutdown
          </Button>
        )}
      </div>

      {roomError && (
        <p role="alert" className="mx-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive lg:mx-8">
          {roomError}
        </p>
      )}
      {roomError && isHost && session.status === "live" && (
        <div className="mx-4 lg:mx-8">
          <Button
            size="sm"
            variant="destructive"
            disabled={working}
            onClick={() => updateSessionStatus("failed")}
          >
            Mark class as failed
          </Button>
        </div>
      )}

      {session.status === "scheduled" && !isHost && (
        <p className="mx-4 rounded-md bg-muted p-4 text-sm lg:mx-8">
          This class is scheduled to start {new Date(session.scheduled_at).toLocaleString()}.
        </p>
      )}
      {isFinished && (
        <div className="mx-4 rounded-md bg-muted p-4 text-sm lg:mx-8">
          {session.status === "failed"
            ? `This class was interrupted and marked failed${session.failure_reason ? `: ${session.failure_reason}` : "."}`
            : session.status === "cancelled"
              ? "This class was cancelled."
              : "This class ended. Attendance is recorded from media-service connection events."}
          {session.course_id && <div className="mt-3">
            <Link href={`/dashboard/my-courses/${session.course_id}`}>
              <Button size="sm" variant="outline">Back to course</Button>
            </Link>
          </div>}
        </div>
      )}
      {session.status === "live" && waiting && (
        <div role="status" className="mx-4 flex items-center gap-3 rounded-md bg-muted p-5 text-sm lg:mx-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          You are in the waiting room. The tutor will admit you shortly.
        </div>
      )}
      {session.status === "live" && !waiting && !credentials && !isHost && !roomError && (
        <div className="mx-4 rounded-md bg-muted p-5 text-sm lg:mx-8">
          Connecting to the classroom…
        </div>
      )}
      {session.status === "live" && !waiting && !credentials && (
        <div className="mx-4 lg:mx-8">
          <Button size="sm" disabled={working} onClick={retryConnection}>
            {working ? "Connecting…" : "Retry connection"}
          </Button>
        </div>
      )}

      {session.status === "live" && credentials && (
        <div className="grid gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
          <div className="h-[calc(100vh-10rem)] min-h-[500px]">
            <LiveKitClassroom
              serverUrl={credentials.serverUrl}
              token={credentials.token}
              onLeave={() => {
                setCredentials(null)
                setRoomError("You disconnected from the classroom. Retry to rejoin.")
              }}
            />
          </div>
          {isHost && (
            <aside className="max-h-[calc(100vh-10rem)] space-y-3 overflow-y-auto rounded-xl border p-4">
              <h2 className="font-semibold">Participants</h2>
              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground">No participants yet.</p>
              )}
              {participants.map((participant) => (
                <div key={participant.user_id} className="space-y-2 border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{participant.name}</span>
                    <div className="flex shrink-0 gap-1">
                      <Badge variant="outline">{participant.role}</Badge>
                      <Badge variant={participant.status === "joined" ? "default" : "secondary"}>
                        {participant.status}
                      </Badge>
                    </div>
                  </div>
                  {participant.joined_at && (
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(participant.joined_at).toLocaleTimeString()}
                      {participant.status === "joined"
                        ? " · Currently connected"
                        : ` · ${Math.floor(participant.connected_seconds / 60)} min connected`}
                    </p>
                  )}
                  {participant.status === "waiting" && (
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => moderate(participant.user_id, "admit")}
                    >
                      <UserCheck className="h-4 w-4" />
                      Admit
                    </Button>
                  )}
                  {["joined", "invited", "waiting"].includes(participant.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => moderate(participant.user_id, "remove")}
                    >
                      <UserX className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </aside>
          )}
        </div>
      )}
    </div>
  )
}