"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDashboardPathOptional } from "@/contexts/dashboard-path-context"
import { useSiteViewOptional } from "@/contexts/site-view-context"

const PENDING_DASHBOARD_PATH_KEY = "nexus_pending_dashboard_path"

export function continueCoursePath(courseId: string) {
  return `/dashboard/my-courses?courseId=${encodeURIComponent(String(courseId))}`
}

export function manageCoursePath(courseId: string) {
  return `/dashboard/my-courses?view=created&courseId=${encodeURIComponent(String(courseId))}`
}

/** Client navigation that respects masked `/` routing. */
export function useDashboardNavigate() {
  const dashboardPath = useDashboardPathOptional()
  const siteView = useSiteViewOptional()
  const router = useRouter()

  return useCallback(
    (path: string) => {
      const target = path.startsWith("/dashboard") ? path : "/dashboard"
      if (dashboardPath) {
        dashboardPath.navigate(target)
        return
      }
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(PENDING_DASHBOARD_PATH_KEY, target)
      }
      if (siteView) {
        siteView.navigate("dashboard")
        return
      }
      router.push(target)
    },
    [dashboardPath, siteView, router],
  )
}
