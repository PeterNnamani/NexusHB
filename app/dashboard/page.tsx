"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useDashboard } from "@/contexts/dashboard-context"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard"
import { normalizeRole } from "@/lib/admin"

export default function DashboardPage() {
  const { user, isLoading, authReady } = useAuth()
  const { currentRole } = useDashboard()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      router.replace("/login")
    }
  }, [user, authReady, router])

  if (!authReady || isLoading) {
    return <div className="p-6">Loading dashboard...</div>
  }
  if (!user) {
    return null
  }

  const role = normalizeRole(currentRole)

  if (role === "tutor" || role === "admin") return <TutorDashboard />
  return <StudentDashboard />
}
