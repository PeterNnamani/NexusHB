"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Chatbot } from "@/components/dashboard/chatbot"
import { useAuth } from "@/contexts/auth-context"
import { DashboardProvider } from "@/contexts/dashboard-context"
import { normalizeRole } from "@/lib/admin"
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const currentRole = normalizeRole(user?.role) as "student" | "tutor" | "admin"

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <DashboardPageSkeleton />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <DashboardHeader
          mobileSidebarOpen={mobileSidebarOpen}
          onMobileSidebarToggle={() => setMobileSidebarOpen((open) => !open)}
          onMobileSidebarClose={() => setMobileSidebarOpen(false)}
        />
        <div className="dashboard-header-offset" aria-hidden="true" />
        <main className="dashboard-main">
          <div className="w-full max-w-full">
            <DashboardProvider currentRole={currentRole}>
              {children}
              <Chatbot />
            </DashboardProvider>
          </div>
        </main>
      </div>
    </div>
  )
}
