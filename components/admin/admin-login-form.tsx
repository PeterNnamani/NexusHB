"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { NexusLogo } from "@/components/brand/nexus-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"

const ADMIN_CAPABILITIES = [
  "Course & curriculum management",
  "Users, enrollments, and finance",
  "News, certificates, and analytics",
] as const

export function AdminLoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { login, isAuthenticated } = useAdminAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/admin")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      await login(email, password)

      toast({ title: "Signed in", description: "Welcome to Nexus Admin." })
      router.replace("/admin")
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid credentials"
      setError(message)
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Form column */}
        <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-4">
              <NexusLogo href={null} size="md" priority />
              <ThemeToggle />
            </div>

            <div className="mb-8 space-y-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                Platform operator
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin sign in</h1>
                <p className="mt-2 text-muted-foreground">
                  Access the Nexus control panel with your operator credentials.
                </p>
              </div>
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base">Operator credentials</CardTitle>
                <CardDescription>
                  Use the email and password configured in your environment.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error ? (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        required
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@yourdomain.com"
                        className="h-11 pl-10"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11 pl-10 pr-10"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign in to admin"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to main site
                </Link>
                <p className="text-xs text-muted-foreground sm:text-right">
                  Students and tutors use the{" "}
                  <Link href="/" className="underline underline-offset-2 hover:text-foreground">
                    main login
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <aside className="relative hidden overflow-hidden border-t border-border bg-muted/30 lg:flex lg:w-[min(44rem,42vw)] lg:flex-col lg:border-l lg:border-t-0">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-foreground/[0.06]" />
          <div className="relative flex flex-1 flex-col justify-center p-10 xl:p-14">
            <div className="mx-auto w-full max-w-md space-y-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-semibold leading-snug">
                  Secure operator access
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This area is separate from learner accounts. Only platform
                  operators with configured credentials can manage courses,
                  billing, and site content.
                </p>
              </div>

              <ul className="space-y-3">
                {ADMIN_CAPABILITIES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                Sessions are signed and stored in an HTTP-only cookie. Keep
                operator credentials private and rotate them if access may have
                been exposed.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
