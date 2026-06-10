"use client"

import { useEffect } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/contexts/auth-context"
import { useSiteView } from "@/contexts/site-view-context"

export default function LoginView() {
  const { user, authReady } = useAuth()
  const { navigate } = useSiteView()

  useEffect(() => {
    if (!authReady) return
    if (user) navigate("dashboard")
  }, [user, authReady, navigate])

  if (user) return null

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to continue your learning journey">
      <LoginForm />
    </AuthLayout>
  )
}
