"use client"

import { useEffect, useState } from "react"
import { BookOpen, Star, Users, BarChart3, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CourseStat {
  id: string
  title: string
  students_count: number
  status: string
  rating: number
}

interface AnalyticsData {
  coursesTaught: number
  publishedCount: number
  activeStudents: number
  averageRating: number
  courses: CourseStat[]
}

export function TutorAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [studentData, setStudentData] = useState<{ courseId: string; progress: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/tutor/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tutor/students").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([stats, students]) => {
        setData(stats)
        const progressRows: { courseId: string; progress: number }[] = []
        for (const s of students?.students || []) {
          for (const c of s.courses || []) {
            progressRows.push({ courseId: c.courseId, progress: c.progress })
          }
        }
        setStudentData(progressRows)
      })
      .finally(() => setLoading(false))
  }, [])

  const avgProgressByCourse = (courseId: string) => {
    const rows = studentData.filter((r) => r.courseId === courseId)
    if (!rows.length) return 0
    return Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance across your teaching portfolio.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Courses", value: data?.coursesTaught ?? 0, sub: `${data?.publishedCount ?? 0} published`, icon: BookOpen },
          { label: "Students", value: data?.activeStudents ?? 0, sub: "Active enrollments", icon: Users },
          { label: "Avg. rating", value: data?.averageRating || "—", sub: "Across courses", icon: Star },
          { label: "Engagement", value: loading ? "…" : `${Math.round(studentData.reduce((s, r) => s + r.progress, 0) / (studentData.length || 1))}%`, sub: "Mean progress", icon: BarChart3 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className="h-4 w-4" />
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : data?.courses?.length ? (
            data.courses.map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="font-medium">{c.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "published" ? "default" : "outline"}>{c.status}</Badge>
                    <span className="text-sm text-muted-foreground">{c.students_count} enrolled</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. student progress</span>
                    <span>{avgProgressByCourse(c.id)}%</span>
                  </div>
                  <Progress value={avgProgressByCourse(c.id)} className="h-2" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Create and publish courses to see analytics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
