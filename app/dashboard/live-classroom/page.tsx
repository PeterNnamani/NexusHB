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
  lesson_id: string | null
  host_id: string
  courses?: { title: string } | null
}

interface CourseOption {
  id: string
  title: string
}

interface LessonOption {
  id: string
  title: string
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [lessons, setLessons] = useState<LessonOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    lessonId: "",
    scheduledAt: "",
    durationMinutes: "60",
    maxParticipants: "50",
    waitingRoom: true,
  })

  const load = useCallback(async () => {
    try {
      const [sessionsRes, subRes] = await Promise.all([
        fetch("/api/live-sessions", { cache: "no-store" }),
        fetch("/api/subscriptions/me", { cache: "no-store" }),
      ])
      if (!sessionsRes.ok) {
        const errorData = await sessionsRes.json().catch(() => ({}))
        throw new Error(errorData.error || "Unable to load live classes")
      }
      const sessionsData = await sessionsRes.json().catch(() => ({}))
      const subData = await subRes.json().catch(() => ({}))
      setSessions(sessionsData.sessions || [])
      setSubInfo(subRes.ok ? subData : null)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load live classes")
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

  const openScheduleDialog = async () => {
    setDialogOpen(true)
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const response = await fetch("/api/live-sessions/options", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to load courses")
      setCourses(result.courses || [])
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : "Unable to load courses")
    } finally {
      setOptionsLoading(false)
    }
  }

  const selectCourse = async (courseId: string) => {
    setForm((current) => ({ ...current, courseId, lessonId: "" }))
    setLessons([])
    if (!courseId) return
    try {
      const response = await fetch(
        `/api/live-sessions/options?courseId=${encodeURIComponent(courseId)}`,
        { cache: "no-store" },
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to load lessons")
      setLessons(result.lessons || [])
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Unable to load lessons",
        variant: "destructive",
      })
    }
  }

  const createSession = async () => {
    if (!form.title.trim() || !form.scheduledAt || !form.courseId) {
      toast({ title: "Title, course and scheduled time are required", variant: "destructive" })
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
          courseId: form.courseId,
          lessonId: form.lessonId || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 60,
          maxParticipants: Number(form.maxParticipants) || 50,
          waitingRoom: form.waitingRoom,
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
      toast({
        title: data.notificationWarning ? "Class scheduled; alerts could not be sent" : "Live class scheduled",
        description: data.notificationWarning
          ? "Students can still find the session on their classroom dashboard."
          : undefined,
        variant: data.notificationWarning ? "destructive" : "default",
      })
      setDialogOpen(false)
      setForm({
        title: "",
        description: "",
        courseId: "",
        lessonId: "",
        scheduledAt: "",
        durationMinutes: "60",
        maxParticipants: "50",
        waitingRoom: true,
      })
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
    if (status === "failed") return "bg-destructive/10 text-destructive"
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
            <Button className="gap-2" onClick={openScheduleDialog}>
              <Plus className="h-4 w-4" />
              Schedule live class
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a live class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Session title"
                  maxLength={160}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <label className="block space-y-1 text-sm">
                  <span>Course</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                    value={form.courseId}
                    disabled={optionsLoading}
                    onChange={(e) => selectCourse(e.target.value)}
                  >
                    <option value="">
                      {optionsLoading ? "Loading courses…" : "Select a course"}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </label>
                {form.courseId && (
                  <label className="block space-y-1 text-sm">
                    <span>Lesson (optional)</span>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3"
                      value={form.lessonId}
                      onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))}
                    >
                      <option value="">Entire course</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                      ))}
                    </select>
                  </label>
                )}
                <p className="text-xs text-muted-foreground">
                  Eligible audience: students with an active or completed enrollment in this course.
                </p>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span>Duration (minutes)</span>
                    <Input
                      type="number"
                      min={15}
                      max={240}
                      value={form.durationMinutes}
                      onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Capacity</span>
                    <Input
                      type="number"
                      min={2}
                      max={500}
                      value={form.maxParticipants}
                      onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.waitingRoom}
                    onChange={(e) => setForm((f) => ({ ...f, waitingRoom: e.target.checked }))}
                  />
                  Use a waiting room; tutor admits students
                </label>
                {optionsError && <p role="alert" className="text-sm text-destructive">{optionsError}</p>}
                <Button
                  onClick={createSession}
                  disabled={creating || optionsLoading || courses.length === 0}
                  className="w-full"
                >
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
        {loadError && (
          <p role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {loadError}
          </p>
        )}
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
                {session.status === "live" && isStudent && !canJoin ? (
                  <Link href="/dashboard/upgrade">
                    <Button variant="outline">Upgrade to join</Button>
                  </Link>
                ) : (session.status === "live" && (isStudent || session.host_id === user?.id)) ||
                  (canHost && session.status === "scheduled" && session.host_id === user?.id) ? (
                  <Link href={`/dashboard/live-classroom/${session.id}`}>
                    <Button variant={session.status === "live" ? "default" : "outline"}>
                      {session.status === "live"
                        ? "Join now"
                        : "Start class"}
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    {session.status === "failed"
                      ? "Class interrupted"
                      : session.status === "live"
                        ? "In progress"
                        : session.status}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
