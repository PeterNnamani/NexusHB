"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { CourseDetail } from "@/components/course/course-detail"
import { useDashboardPath } from "@/contexts/dashboard-path-context"
import type { CourseWithContent } from "@/lib/courses-db"

export default function MyCourseDetailView({ courseId }: { courseId: string }) {
  const { navigate } = useDashboardPath()
  const [course, setCourse] = useState<CourseWithContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/courses/${encodeURIComponent(courseId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCourse(data.course ?? null)
      })
      .catch(() => {
        if (!cancelled) setCourse(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return <p className="text-muted-foreground">Course not found.</p>
  }

  return (
    <div className="space-y-8">
      <CourseDetail
        course={course}
        backHref="/dashboard/my-courses"
        onBackClick={() => navigate("/dashboard/my-courses")}
      />
    </div>
  )
}
