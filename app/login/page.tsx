import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Log In | Nexus",
  description: "Log in to your Nexus account to continue your learning journey.",
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to continue your learning journey"
    >
      <LoginForm />
    </AuthLayout>
  )
}
