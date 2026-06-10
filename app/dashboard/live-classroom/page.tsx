"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Video,
  Plus,
  Calendar,
  Users,
  Lock,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface LiveSession {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_at: string
  duration_minutes: number
  room_name: string
  course_id: string | null
  courses?: { title: string } | null
}

interface SubscriptionInfo {
  subscription: { planName: string; currentPeriodEnd: string } | null
  effectivePlanName?: string
  liveClassroom: boolean
  liveClassroomJoin?: boolean
  role?: string
}

export default function LiveClassroomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: "60",
  })

  const load = useCallback(async () => {
    try {
      const [sessionsRes, subRes] = await Promise.all([
        fetch("/api/live-sessions", { cache: "no-store" }),
        fetch("/api/subscriptions/me", { cache: "no-store" }),
      ])
      const sessionsData = await sessionsRes.json().catch(() => ({}))
      const subData = await subRes.json().catch(() => ({}))
      setSessions(sessionsData.sessions || [])
      setSubInfo(subRes.ok ? subData : null)
    } catch {
      setSessions([])
      setSubInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const canHost = subInfo?.liveClassroom || user?.role === "admin"
  const canJoin = subInfo?.liveClassroomJoin || canHost
  const isStudent = subInfo?.role === "student" || user?.role === "student"

  const createSession = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast({ title: "Title and schedule time are required", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 60,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          toast({
            title: "Upgrade required",
            description: data.error,
            variant: "destructive",
          })
          router.push("/dashboard/upgrade")
          return
        }
        throw new Error(data.error || "Failed to create session")
      }
      toast({ title: "Live class scheduled" })
      setDialogOpen(false)
      setForm({ title: "", description: "", scheduledAt: "", durationMinutes: "60" })
      load()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Could not create session",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const statusColor = (status: string) => {
    if (status === "live") return "bg-green-500/10 text-green-600"
    if (status === "ended") return "bg-muted text-muted-foreground"
    if (status === "cancelled") return "bg-destructive/10 text-destructive"
    return "bg-primary/10 text-primary"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Nexus Live Classroom
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold">Live Classroom</h1>
          <p className="text-muted-foreground mt-1">
            {canHost
              ? "Host integrated video sessions for your students."
              : canJoin
                ? "Join live sessions hosted by your tutors."
                : "Upgrade to Learner Plus to join sessions, or Tutor Plus to host your own."}
          </p>
        </div>

        {canHost ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule live class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a live class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Session title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
                <Input
                  type="number"
                  min={15}
                  max={240}
                  placeholder="Duration (minutes)"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                />
                <Button onClick={createSession} disabled={creating} className="w-full">
                  {creating ? "Creating…" : "Create session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Link href="/dashboard/upgrade">
            <Button variant="outline" className="gap-2">
              <Lock className="h-4 w-4" />
              Upgrade for Live Classroom
            </Button>
          </Link>
        )}
      </div>

      {(subInfo?.subscription || subInfo?.effectivePlanName) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                Plan:{" "}
                <strong>
                  {subInfo.subscription?.planName || subInfo.effectivePlanName}
                </strong>
              </span>
            </div>
            {subInfo.subscription?.currentPeriodEnd && (
              <span className="text-muted-foreground">
                Renews {new Date(subInfo.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {!canHost && !canJoin && (
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Live Classroom requires a premium plan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isStudent ? (
                  <>
                    Upgrade to <strong>Learner Plus</strong> or <strong>Learner Pro</strong> to join
                    live sessions with your tutors.
                  </>
                ) : (
                  <>
                    Upgrade to <strong>Tutor Plus</strong> to host live
                    video classes.
                  </>
                )}
              </p>
            </div>
            <Link href="/dashboard/upgrade">
              <Button>View plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming & recent sessions</h2>
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No live classes scheduled yet.
              {canHost && " Create your first session to start teaching live."}
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="transition-colors hover:border-primary/30">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{session.title}</h3>
                    <Badge className={statusColor(session.status)}>{session.status}</Badge>
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(session.scheduled_at).toLocaleString()}
                    </span>
                    <span>{session.duration_minutes} min</span>
                    {session.courses?.title && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {session.courses.title}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/dashboard/live-classroom/${session.id}`}>
                  <Button variant={session.status === "live" ? "default" : "outline"}>
                    {session.status === "live" ? "Join now" : "Enter classroom"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
