"use client"

import { useState, useEffect, useMemo } from "react"
import {
  GraduationCap,
  CheckCircle2,
  Trophy,
  ChevronRight,
  Play,
  Circle,
  Star,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface Course {
  id: string
  title: string
  category: string
  level: string
  duration: string
}

interface Milestone {
  id: string
  title: string
  status: "completed" | "in-progress" | "not-started"
  progress: number
}

interface LearningPath {
  id: string
  title: string
  description: string
  progress: number
  totalCourses: number
  completedCourses: number
  level: string
  milestones: Milestone[]
}

export default function LearningPathPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .catch(() => setCourses([]))
  }, [])

  const paths = useMemo<LearningPath[]>(() => {
    if (!user?.enrolledCourses?.length || courses.length === 0) return []
    const enrolled = courses.filter((c) => user.enrolledCourses.includes(c.id))
    const byCategory = new Map<string, Course[]>()
    for (const c of enrolled) {
      const cat = c.category || "General"
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(c)
    }

    return Array.from(byCategory.entries()).map(([category, list]) => {
      const milestones: Milestone[] = list.map((c) => {
        const progress = user.courseProgress?.[c.id] ?? 0
        const completed = user.completedCourses?.includes(c.id) || progress >= 100
        return {
          id: c.id,
          title: c.title,
          status: completed ? "completed" : progress > 0 ? "in-progress" : "not-started",
          progress,
        }
      })
      const completedCount = milestones.filter((m) => m.status === "completed").length
      const avg = Math.round(
        milestones.reduce((s, m) => s + (m.status === "completed" ? 100 : m.progress), 0) /
          (milestones.length || 1),
      )
      return {
        id: category,
        title: `${category} Path`,
        description: `Your ${category.toLowerCase()} learning journey across ${list.length} enrolled course${list.length > 1 ? "s" : ""}.`,
        progress: avg,
        totalCourses: list.length,
        completedCourses: completedCount,
        level: list[0]?.level || "All levels",
        milestones,
      }
    })
  }, [courses, user?.enrolledCourses, user?.completedCourses, user?.courseProgress])

  const selectedPath = paths.find((p) => p.id === selectedId) || paths[0] || null

  if (!user?.enrolledCourses?.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Learning Path</h1>
          <p className="text-muted-foreground mt-1">Follow structured paths to achieve your goals</p>
        </div>
        <div className="glass-card p-12 rounded-2xl text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No learning paths yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">Enroll in courses to build your personalized learning path.</p>
          <Link href="/dashboard/browse-courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Learning Path</h1>
        <p className="text-muted-foreground mt-1">Follow structured paths to achieve your career goals</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Your Learning Paths</h2>
          <div className="space-y-3">
            {paths.map((path) => (
              <button
                key={path.id}
                onClick={() => setSelectedId(path.id)}
                className={cn(
                  "w-full glass-card p-4 rounded-2xl text-left transition-all",
                  selectedPath?.id === path.id ? "ring-2 ring-primary" : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{path.title}</h3>
                  <ChevronRight className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    selectedPath?.id === path.id && "text-primary rotate-90",
                  )} />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{path.progress}%</span>
                  </div>
                  <Progress value={path.progress} className="h-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedPath && (
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedPath.title}</h2>
                <p className="text-muted-foreground mt-1">{selectedPath.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <GraduationCap className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-lg font-bold">{selectedPath.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-lg font-bold">{selectedPath.completedCourses}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Star className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-lg font-bold capitalize">{selectedPath.level}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold">{selectedPath.progress}%</span>
                </div>
                <Progress value={selectedPath.progress} className="h-3" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Courses</h3>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {selectedPath.milestones.map((m) => (
                    <div key={m.id} className="relative flex gap-4">
                      <div className={cn(
                        "relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        m.status === "completed" && "bg-green-500 text-white",
                        m.status === "in-progress" && "bg-primary text-primary-foreground",
                        m.status === "not-started" && "bg-muted text-muted-foreground",
                      )}>
                        {m.status === "completed" ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : m.status === "in-progress" ? (
                          <Play className="h-6 w-6" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 glass-card p-4 rounded-2xl">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{m.title}</h4>
                              <Badge
                                variant={m.status === "completed" ? "default" : m.status === "in-progress" ? "secondary" : "outline"}
                                className={m.status === "completed" ? "bg-green-500" : ""}
                              >
                                {m.status === "completed" ? "Completed" : m.status === "in-progress" ? `${m.progress}%` : "Not started"}
                              </Badge>
                            </div>
                          </div>
                          <Link href={`/dashboard/my-courses/${m.id}`}>
                            <Button variant={m.status === "completed" ? "outline" : "default"} size="sm">
                              {m.status === "completed" ? "Review" : "Continue"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Path Completion</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Complete all courses to finish your {selectedPath.title}
              </p>
              <Progress value={selectedPath.progress} className="h-2 mt-4 max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                {selectedPath.progress}% complete - {100 - selectedPath.progress}% to go
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
