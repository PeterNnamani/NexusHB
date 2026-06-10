"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"
import { useAuth } from "@/contexts/auth-context"

export default function SignupPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already logged in (user loads instantly from localStorage)
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  // Don't render signup form if already authenticated
  if (user) {
    return null
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your learning journey with Nexus"
    >
      <SignupForm />
    </AuthLayout>
  )
}
