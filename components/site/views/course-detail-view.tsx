"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useSiteView } from "@/contexts/site-view-context"
import { useDashboardNavigate } from "@/hooks/use-dashboard-navigate"

export default function CourseDetailView() {
  const { courseId } = useSiteView()
  const navigateDashboard = useDashboardNavigate()

  useEffect(() => {
    navigateDashboard(
      courseId
        ? `/dashboard/browse-courses/${encodeURIComponent(courseId)}`
        : "/dashboard/browse-courses",
    )
  }, [courseId, navigateDashboard])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Opening course" />
    </div>
  )
}
