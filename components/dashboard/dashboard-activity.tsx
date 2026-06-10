"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle, Trophy, BookOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Activity {
  id: string
  icon: typeof CheckCircle
  title: string
  description: string
  time: string
  color: string
  at: number
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DashboardActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])

  const load = useCallback(async () => {
    if (!user?.id) return

    const [progressRes, enrollRes, certRes] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at, lessons(title)")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(5),
      supabase
        .from("enrollments")
        .select("course_id, enrolled_at, courses(title)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false })
        .limit(5),
      supabase
        .from("certificates")
        .select("id, issued_at, courses(title)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false })
        .limit(5),
    ])

    const items: Activity[] = []

    for (const p of progressRes.data || []) {
      const row = p as any
      items.push({
        id: `lesson-${row.lesson_id}`,
        icon: CheckCircle,
        title: "Completed lesson",
        description: row.lessons?.title || "Lesson",
        time: timeAgo(row.completed_at),
        color: "text-primary bg-primary/10",
        at: new Date(row.completed_at).getTime(),
      })
    }
    for (const e of enrollRes.data || []) {
      const row = e as any
      items.push({
        id: `enroll-${row.course_id}`,
        icon: BookOpen,
        title: "Enrolled in course",
        description: row.courses?.title || "Course",
        time: timeAgo(row.enrolled_at),
        color: "text-chart-5 bg-chart-5/10",
        at: new Date(row.enrolled_at).getTime(),
      })
    }
    for (const c of certRes.data || []) {
      const row = c as any
      items.push({
        id: `cert-${row.id}`,
        icon: Trophy,
        title: "Earned certificate",
        description: row.courses?.title || "Course",
        time: timeAgo(row.issued_at),
        color: "text-chart-4 bg-chart-4/10",
        at: new Date(row.issued_at).getTime(),
      })
    }

    items.sort((a, b) => b.at - a.at)
    setActivities(items.slice(0, 6))
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet. Start learning to see your progress here.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${activity.color} flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
