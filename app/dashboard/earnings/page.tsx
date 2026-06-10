"use client"

import { useAuth } from "@/contexts/auth-context"
import { canTeachCourses } from "@/lib/admin"
import { TutorEarnings } from "@/components/dashboard/tutor-earnings"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function EarningsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !canTeachCourses(user.role)) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading || !canTeachCourses(user?.role)) return null

  return <TutorEarnings />
}
