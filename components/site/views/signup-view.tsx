"use client"

import { useEffect } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"
import { useAuth } from "@/contexts/auth-context"
import { useSiteView } from "@/contexts/site-view-context"

export default function SignupView() {
  const { user, authReady } = useAuth()
  const { navigate } = useSiteView()

  useEffect(() => {
    if (!authReady) return
    if (user) navigate("dashboard")
  }, [user, authReady, navigate])

  if (user) return null

  return (
    <AuthLayout title="Create Account" subtitle="Join Nexus and start learning today">
      <SignupForm />
    </AuthLayout>
  )
}
