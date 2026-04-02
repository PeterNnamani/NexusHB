import { AuthLayout } from "@/components/auth/auth-layout"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata = {
  title: "Sign Up | Nexus",
  description: "Create your Nexus account and start your web development journey today.",
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your learning journey with Nexus"
    >
      <SignupForm />
    </AuthLayout>
  )
}
