"use client"

import { useEffect, useState } from "react"
import { CourseDetail } from "@/components/course/course-detail"
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton"
import { useDashboardPath } from "@/contexts/dashboard-path-context"
import type { CourseWithContent } from "@/lib/courses-db"

export default function MyCourseDetailView({
  courseId,
  backHref = "/dashboard/my-courses",
}: {
  courseId: string
  backHref?: string
}) {
  const { navigate } = useDashboardPath()
  const [course, setCourse] = useState<CourseWithContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/courses/${encodeURIComponent(courseId)}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load course details (${response.status}).`)
        }
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setCourse(data.course ?? null)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setCourse(null)
          setError(cause instanceof Error ? cause.message : "Could not load course details.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return <DashboardPageSkeleton courseDetail />
  }

  if (!course) {
    return <p className="text-muted-foreground">{error ?? "Course not found."}</p>
  }

  return (
    <div className="space-y-8">
      <CourseDetail
        course={course}
        backHref={backHref}
        onBackClick={() => navigate(backHref)}
      />
    </div>
  )
}
