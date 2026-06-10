"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Award,
  Diamond,
  Users,
  ShieldCheck,
  Sparkles,
  Video,
  Loader2,
  Check,
  GraduationCap,
  BookOpen,
  Crown,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  PLAN_DEFINITIONS,
  plansForUpgradeView,
  isTeachingRole,
  getPlanBySlug,
  type PlanSlug,
  type PlanView,
} from "@/lib/plans"
import { fetchJson } from "@/lib/fetch-json"
import { initializePaystackPayment } from "@/lib/init-paystack-payment"
import { openPaystackCheckout } from "@/lib/paystack-checkout"
import { verifyPaymentWithRetry } from "@/lib/verify-payment-client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { resolveCheckoutEmail } from "@/lib/checkout-client"

const ICONS = {
  learner: BookOpen,
  learner_plus: GraduationCap,
  learner_pro: Crown,
  tutor: Award,
  tutor_plus: Diamond,
} as const

interface SubscriptionState {
  effectivePlanSlug: string
  effectivePlanName: string
  isPaid: boolean
  currentPeriodEnd?: string
  role: string
}

export default function UpgradePage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [processing, setProcessing] = useState<PlanSlug | null>(null)
  const [activating, setActivating] = useState(false)
  const [subState, setSubState] = useState<SubscriptionState | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [subRefreshing, setSubRefreshing] = useState(false)
  const hasSubLoadedRef = useRef(false)

  const accountRole = user?.role || subState?.role || "student"
  const isTeacher = isTeachingRole(accountRole)
  const initialView: PlanView =
    searchParams.get("view") === "tutor" || isTeacher ? "tutor" : "student"
  const [planView, setPlanView] = useState<PlanView>(initialView)

  useEffect(() => {
    if (searchParams.get("view") === "tutor" && !isTeacher) {
      setPlanView("tutor")
    }
  }, [searchParams, isTeacher])

  const setPlanViewAndUrl = (view: PlanView) => {
    setPlanView(view)
    const params = new URLSearchParams(searchParams.toString())
    if (view === "tutor" && !isTeacher) {
      params.set("view", "tutor")
    } else {
      params.delete("view")
    }
    const qs = params.toString()
    router.replace(qs ? `/dashboard/upgrade?${qs}` : "/dashboard/upgrade", { scroll: false })
  }

  const visiblePlans = plansForUpgradeView(planView, accountRole)
  const showingTutorPlans = planView === "tutor" || isTeacher
  const freePlan = !showingTutorPlans
    ? PLAN_DEFINITIONS.find((p) => p.slug === "learner")
    : null

  const applySubscriptionPayload = useCallback((data: {
    effectivePlanSlug: string
    effectivePlanName: string
    isPaid: boolean
    subscription?: { currentPeriodEnd?: string }
    role: string
  }) => {
    setSubState({
      effectivePlanSlug: data.effectivePlanSlug,
      effectivePlanName: data.effectivePlanName,
      isPaid: data.isPaid,
      currentPeriodEnd: data.subscription?.currentPeriodEnd,
      role: data.role,
    })
  }, [])

  const loadSubscription = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (silent) {
      setSubRefreshing(true)
    } else if (!hasSubLoadedRef.current) {
      setSubLoading(true)
    }

    try {
      const data = await fetchJson<{
        effectivePlanSlug: string
        effectivePlanName: string
        isPaid: boolean
        subscription?: { currentPeriodEnd?: string }
        role: string
      }>("/api/subscriptions/me", { timeoutMs: 10_000 })
      applySubscriptionPayload(data)
      hasSubLoadedRef.current = true
      return data
    } catch {
      return null
    } finally {
      setSubLoading(false)
      setSubRefreshing(false)
    }
  }, [applySubscriptionPayload])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      loadSubscription()
      refreshUser()
      toast({ title: "Subscription updated" })
    }
  }, [searchParams, loadSubscription, refreshUser, toast])

  const checkout = async (planSlug: PlanSlug) => {
    if (!user) {
      router.push("/login?redirect=/dashboard/upgrade")
      return
    }

    const plan = PLAN_DEFINITIONS.find((p) => p.slug === planSlug)
    if (!plan?.purchasable) return

    setProcessing(planSlug)

    try {
      const checkoutEmail = await resolveCheckoutEmail(user.email)
      if (!checkoutEmail) {
        throw new Error("Your account needs an email address before checkout.")
      }

      const init = await initializePaystackPayment({
        amount: plan.price,
        email: checkoutEmail,
        name: user.name || checkoutEmail.split("@")[0],
        planSlug,
        userId: user.id,
        metadata: { type: "subscription", planSlug },
      })

      if (!init.success) {
        throw new Error(init.error || "Checkout failed")
      }

      await openPaystackCheckout({
        email: checkoutEmail,
        amount: plan.price,
        reference: init.reference!,
        authorizationUrl: init.authorizationUrl,
        onClose: () => setProcessing(null),
        onSuccess: async (paidRef) => {
          setProcessing(null)
          setActivating(true)

          try {
            const verifyData = await verifyPaymentWithRetry(paidRef, {
              isSubscription: true,
            })

            const activatedSlug = (verifyData.planSlug || plan.slug) as PlanSlug
            const activatedPlan = getPlanBySlug(activatedSlug) || plan

            applySubscriptionPayload({
              effectivePlanSlug: activatedSlug,
              effectivePlanName: activatedPlan.name,
              isPaid: true,
              subscription: {
                currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
              },
              role: activatedPlan.roleUpgrade || accountRole,
            })

            if (activatedPlan.audience === "tutor") {
              setPlanView("tutor")
            }

            await Promise.all([
              refreshUser({ retries: 4 }),
              loadSubscription({ silent: true }),
            ])

            toast({
              title: `${activatedPlan.name} activated`,
              description: verifyData.message || "Your plan is now active.",
            })
          } catch (err) {
            toast({
              title: "Could not activate plan",
              description:
                err instanceof Error
                  ? err.message
                  : "Payment received but activation failed. Tap Refresh plan status.",
              variant: "destructive",
            })
            await loadSubscription({ silent: true })
          } finally {
            setActivating(false)
          }
        },
      })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Checkout failed",
        variant: "destructive",
      })
      setProcessing(null)
    }
  }

  const activeSlug = subState?.effectivePlanSlug

  return (
    <div className="space-y-8 w-full">
      <div>
        <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">
          {showingTutorPlans ? "Teaching plans" : "Learning plans"}
        </p>
        <h1 className="text-3xl font-bold">
          {showingTutorPlans
            ? "Start teaching on Nexus"
            : "Upgrade your learning experience"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {showingTutorPlans ? (
            <>
              Subscribe to a tutor plan to unlock course creation, student tools, and{" "}
              <strong>Nexus Live Classroom hosting</strong>. Billed monthly via Paystack.
            </>
          ) : (
            <>
              Student plans unlock live class access, certificates, and premium learning tools.
            </>
          )}
        </p>

        {!isTeacher && (
          <div className="mt-6 inline-flex rounded-full border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setPlanViewAndUrl("student")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                planView === "student"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Learning plans
            </button>
            <button
              type="button"
              onClick={() => setPlanViewAndUrl("tutor")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                planView === "tutor"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Teaching plans
            </button>
          </div>
        )}

        {planView === "tutor" && !isTeacher && (
          <Card className="mt-4 border-primary/25 bg-primary/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Subscribing to a tutor plan upgrades your account to <strong>tutor</strong> and unlocks
              teaching tools, course publishing, and live classroom hosting.
            </CardContent>
          </Card>
        )}
      </div>

      {activating && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            <p>Confirming your payment and activating your plan…</p>
          </CardContent>
        </Card>
      )}

      {subLoading && !subState ? (
        <Card>
          <CardContent className="p-5 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            Loading your plan…
          </CardContent>
        </Card>
      ) : subState ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Current plan: {subState.effectivePlanName}
                  {subRefreshing && (
                    <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin text-primary" />
                  )}
                  {subState.isPaid && (
                    <Badge className="ml-2 bg-primary/15 text-primary border-0">Active</Badge>
                  )}
                  {!subState.isPaid && (
                    <Badge variant="secondary" className="ml-2">Free tier</Badge>
                  )}
                </p>
                {subState.isPaid && subState.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Renews {new Date(subState.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {subState.isPaid && isTeacher && (
              <Link href="/dashboard/live-classroom">
                <Button variant="outline" size="sm">
                  Open Live Classroom
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : null}

      {freePlan && (
        <Card className={activeSlug === "learner" && !subState?.isPaid ? "ring-2 ring-primary/40" : ""}>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{freePlan.name}</p>
              <p className="text-2xl font-bold mt-1">Free</p>
              <p className="text-sm text-muted-foreground mt-1">{freePlan.description}</p>
            </div>
            {activeSlug === "learner" && !subState?.isPaid ? (
              <Badge className="self-start sm:self-center">Your current plan</Badge>
            ) : (
              <Badge variant="outline" className="self-start sm:self-center">Included</Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => {
          const Icon = ICONS[plan.slug]
          const isCurrent = activeSlug === plan.slug && subState?.isPaid
          return (
            <Card
              key={plan.slug}
              className={`overflow-hidden h-full flex flex-col ${
                isCurrent ? "ring-2 ring-primary shadow-md" : ""
              } ${plan.highlight && !isCurrent ? "border-primary shadow-md" : ""}`}
            >
              <div
                className={`p-6 ${
                  isCurrent || plan.highlight
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">{plan.name}</p>
                    <p className="text-4xl font-bold mt-2">
                      ₦{plan.price.toLocaleString()}
                      <span className="text-sm font-normal opacity-80">/mo</span>
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      isCurrent || plan.highlight
                        ? "bg-white/15"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {isCurrent && (
                    <Badge className="bg-white/20 text-white border-0">Active plan</Badge>
                  )}
                  {plan.highlight && !isCurrent && (
                    <Badge className="bg-white/20 text-white border-0">Most popular</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-6 space-y-5 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.featureFlags.live_classroom && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-sm flex items-center gap-2 text-primary">
                    <Video className="h-4 w-4 shrink-0" />
                    Host Nexus Live Classroom
                  </div>
                )}
                {plan.featureFlags.live_classroom_join && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-sm flex items-center gap-2 text-primary">
                    <Video className="h-4 w-4 shrink-0" />
                    Join live classroom sessions
                  </div>
                )}
                <Button
                  className="w-full mt-auto"
                  variant={isCurrent || plan.highlight ? "default" : "outline"}
                  disabled={!!processing || activating || isCurrent}
                  onClick={() => checkout(plan.slug)}
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Activating…
                    </>
                  ) : processing === plan.slug ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checkout open…
                    </>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {isTeacher ? "Why upgrade?" : "Student vs tutor plans"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {isTeacher ? (
                <>
                  <div className="rounded-xl border p-4">
                    <Video className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium">Live Classroom</p>
                    <p className="text-muted-foreground mt-1">
                      Host HD video classes inside Nexus — no Zoom links needed.
                    </p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium">Secure billing</p>
                    <p className="text-muted-foreground mt-1">
                      Monthly billing through Paystack. Cancel anytime before renewal.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border p-4">
                    <GraduationCap className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium">For learners</p>
                    <p className="text-muted-foreground mt-1">
                      Learner Plus & Pro unlock certificates, live class joining, and premium tools.
                    </p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <Award className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium">Want to teach?</p>
                    <p className="text-muted-foreground mt-1">
                      Switch to Teaching plans above to see Tutor, Tutor Plus, and Agent pricing.
                    </p>
                    <Button
                      variant="link"
                      className="px-0 h-auto mt-2"
                      onClick={() => setPlanViewAndUrl("tutor")}
                    >
                      View tutor plans →
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Need help?
            </h2>
            <p className="text-sm text-muted-foreground">
              Payments are processed securely through Paystack. After paying, your plan updates
              automatically on this page.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={subRefreshing || activating}
                onClick={async () => {
                  try {
                    const reconcileData = await fetchJson<{
                      success?: boolean
                      message?: string
                    }>("/api/subscriptions/reconcile", {
                      method: "POST",
                      timeoutMs: 15_000,
                    })
                    if (reconcileData.success) {
                      toast({
                        title: "Plan synced",
                        description: reconcileData.message,
                      })
                    }
                  } catch {
                    /* optional reconcile */
                  }
                  await Promise.all([
                    refreshUser({ retries: 3 }),
                    loadSubscription({ silent: true }),
                  ])
                }}
              >
                Refresh plan status
              </Button>
              <Link href="/dashboard/settings">
                <Button variant="ghost">Account settings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
