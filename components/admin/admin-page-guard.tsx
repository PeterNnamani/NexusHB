"use client"

import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/contexts/admin-auth-context"

export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAdminAuth()

  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Button variant="outline" onClick={() => void logout()}>
          Admin sign in
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
