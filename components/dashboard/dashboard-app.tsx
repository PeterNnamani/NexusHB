"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useSiteView } from "@/contexts/site-view-context"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Chatbot } from "@/components/dashboard/chatbot"
import { DashboardPathRenderer } from "@/components/dashboard/dashboard-path-renderer"
import { useAuth } from "@/contexts/auth-context"
import { DashboardProvider } from "@/contexts/dashboard-context"
import { DashboardPathProvider } from "@/contexts/dashboard-path-context"
import { normalizeRole } from "@/lib/admin"

function DashboardLayoutInner() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { navigate } = useSiteView()
  const currentRole = normalizeRole(user?.role) as "student" | "tutor" | "admin"

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("login")
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen flex bg-muted/30">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <DashboardHeader />
        <div className="dashboard-header-offset" aria-hidden="true" />
        <main className="dashboard-main">
          <div className="w-full max-w-full">
            <DashboardProvider currentRole={currentRole}>
              <DashboardPathRenderer />
              <Chatbot />
            </DashboardProvider>
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardApp() {
  return (
    <DashboardPathProvider>
      <DashboardLayoutInner />
    </DashboardPathProvider>
  )
}
