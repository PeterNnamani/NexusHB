"use client"

import { useAuth } from "@/contexts/auth-context"
import { canTeachCourses } from "@/lib/admin"
import { TutorAnalytics } from "@/components/dashboard/tutor-analytics"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !canTeachCourses(user.role)) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading || !canTeachCourses(user?.role)) return null

  return <TutorAnalytics />
}
