"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in (user loads instantly from localStorage)
  useEffect(() => {
    if (!authReady) return;

    if (user) {
      router.replace("/dashboard");
    }
  }, [user, authReady, router]);

  // Don't render login form if already authenticated
  if (user) {
    return null;
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to continue your learning journey"
    >
      <LoginForm />
    </AuthLayout>
  );
}
