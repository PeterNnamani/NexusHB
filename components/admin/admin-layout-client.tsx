"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AdminAuthProvider, useAdminAuth } from "@/contexts/admin-auth-context"
import { AdminViewProvider } from "@/contexts/admin-view-context"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAdminAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === "/admin/login") {
      router.replace("/admin")
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="admin-theme min-h-screen bg-background" />}>
        <AdminLoginForm />
      </Suspense>
    )
  }

  if (pathname === "/admin/login") {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminViewProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminViewProvider>
    </AdminAuthProvider>
  )
}
