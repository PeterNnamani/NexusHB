"use client"

import { useEffect, useState } from "react"
import { BookOpen, Clock, Trophy, Flame } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function DashboardStats() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<{ id: string; duration: string }[]>([])

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
  }, [])

  const enrolledCount = user?.enrolledCourses?.length ?? 0
  const completedCount = user?.completedCourses?.length ?? 0
  const inProgressCount = Math.max(0, enrolledCount - completedCount)
  const streak = user?.streak ?? 0

  const totalHours = courses
    .filter((c) => user?.enrolledCourses?.includes(c.id))
    .reduce((sum, course) => sum + (parseInt(course.duration) || 0), 0)

  const stats = [
    {
      icon: BookOpen,
      label: "In Progress",
      value: inProgressCount.toString(),
      change: inProgressCount === 0 ? "Start your first course" : `${completedCount} completed`,
      color: "text-emerald-800 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300",
    },
    {
      icon: Clock,
      label: "Total Weeks",
      value: totalHours.toString(),
      change: totalHours === 0 ? "Start your first course" : "Across enrolled courses",
      color: "text-sky-800 bg-sky-500/10 border-sky-500/20 dark:text-sky-300",
    },
    {
      icon: Trophy,
      label: "Completed",
      value: completedCount.toString(),
      change: completedCount > 0 ? `${completedCount} course${completedCount !== 1 ? "s" : ""}` : "Start your first course",
      color: "text-violet-800 bg-violet-500/10 border-violet-500/20 dark:text-violet-300",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: streak.toString(),
      change: streak > 0 ? "Keep it up!" : "Start learning",
      color: "text-orange-800 bg-orange-500/10 border-orange-500/20 dark:text-orange-300",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={stat.label} style={{ animationDelay: `${index * 60}ms` }} className="metric-enter glass-card relative overflow-hidden rounded-xl border-border/70 bg-card/80 p-4 sm:p-5 dark:hover:bg-[var(--bg-surface)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="mb-3 flex items-center gap-3">
            <div className={`rounded-xl border p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
          <p className="mb-1 font-heading text-[32px] font-semibold tabular-nums tracking-tight text-foreground">{stat.value}</p>
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <p className={`mt-2 text-xs ${stat.value === "0" ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>{stat.change}</p>
        </div>
      ))}
    </div>
  )
}
