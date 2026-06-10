"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
  Smartphone,
  ThumbsUp,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { initializePaystackPayment } from "@/lib/init-paystack-payment"
import { openPaystackCheckout } from "@/lib/paystack-checkout"
import { verifyPaymentWithRetry } from "@/lib/verify-payment-client"
import {
  assertCheckoutReady,
  normalizeCheckoutAmount,
  resolveCheckoutEmail,
} from "@/lib/checkout-client"
import { cn } from "@/lib/utils"

type PaymentMethod = "card" | "bank" | "ussd"

const STEPS = [
  { id: "cart", label: "Cart" },
  { id: "payment", label: "Payment" },
  { id: "success", label: "Done" },
] as const

function UnderlineField({
  label,
  value,
  placeholder,
  readOnly,
  type = "text",
}: {
  label: string
  value?: string
  placeholder?: string
  readOnly?: boolean
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full border-0 border-b border-border bg-transparent py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary read-only:text-foreground/80"
      />
    </label>
  )
}

function CheckoutStepper({ activeStep }: { activeStep: number }) {
  return (
    <ol className="mb-10 flex items-center justify-center gap-0 sm:gap-2">
      {STEPS.map((step, i) => {
        const done = i < activeStep
        const active = i === activeStep && activeStep < STEPS.length
        const complete = done || activeStep >= STEPS.length
        return (
          <li key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 px-3 sm:px-5">
              <div
                className={cn(
                  "checkout-step-fill flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold",
                  complete && "border-primary bg-primary text-primary-foreground scale-100",
                  active && !complete && "border-primary bg-primary/10 text-primary scale-105",
                  !done && !active && !complete && "border-border text-muted-foreground",
                  done && "scale-100",
                )}
                style={{ transitionDelay: complete ? `${i * 120}ms` : "0ms" }}
              >
                {complete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-semibold uppercase tracking-wide transition-colors duration-300 sm:block",
                  complete || active ? "text-foreground" : "text-muted-foreground",
                )}
                style={{ transitionDelay: complete ? `${i * 120}ms` : "0ms" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "checkout-step-connector mb-5 h-px w-8 sm:w-16",
                  i < activeStep || activeStep >= STEPS.length ? "bg-primary" : "bg-border",
                )}
                style={{
                  transitionDelay:
                    activeStep >= STEPS.length ? `${(i + 1) * 120}ms` : "0ms",
                }}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function EnrollmentSuccessView({
  courseCount,
  onContinue,
}: {
  courseCount: number
  onContinue: () => void
}) {
  const [stepperStep, setStepperStep] = useState(2)
  const redirectedRef = useRef(false)

  useEffect(() => {
    const toDone = window.setTimeout(() => setStepperStep(3), 400)
    return () => window.clearTimeout(toDone)
  }, [])

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      if (redirectedRef.current) return
      redirectedRef.current = true
      onContinue()
    }, 3000)

    return () => window.clearTimeout(redirectTimer)
  }, [onContinue])

  const handleContinue = () => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    onContinue()
  }

  return (
    <div className="mx-auto max-w-lg py-12 text-center lg:py-20">
      <CheckoutStepper activeStep={stepperStep} />

      <div className="checkout-thumbs-pop mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <ThumbsUp className="checkout-thumbs-wiggle h-12 w-12 text-primary" strokeWidth={2.25} />
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Enrollment successful!
      </h1>
      <p className="mb-2 text-muted-foreground">
        You&apos;re now enrolled in {courseCount} {courseCount === 1 ? "course" : "courses"}.
        Start learning right away.
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        Redirecting to My Courses in a moment…
      </p>

      <Button onClick={handleContinue} className="rounded-full px-10">
        View my courses
      </Button>
    </div>
  )
}

export interface CartCheckoutProps {
  onBack: () => void
  onBrowseCourses: () => void
  onCheckoutSuccess: () => void
  onLoginRequired: () => void
}

export function CartCheckout({
  onBack,
  onBrowseCourses,
  onCheckoutSuccess,
  onLoginRequired,
}: CartCheckoutProps) {
  const { items, removeFromCart, clearCart, getTotalPrice } = useCart()
  const { user, refreshUser } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<{ courseCount: number } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [promoCode, setPromoCode] = useState("")

  useEffect(() => {
    if (!user?.enrolledCourses?.length || items.length === 0) return
    const enrolled = new Set(user.enrolledCourses.map(String))
    items
      .filter((item) => enrolled.has(String(item.id)))
      .forEach((item) => removeFromCart(item.id))
  }, [user?.enrolledCourses, items, removeFromCart])

  const totalPrice = getTotalPrice()
  const activeStep = enrollmentSuccess
    ? STEPS.length
    : items.length === 0
      ? 0
      : isProcessing || isVerifying
        ? 1
        : 0

  const handleCheckout = async () => {
    if (!user) {
      onLoginRequired()
      return
    }
    if (items.length === 0) return

    setIsProcessing(true)
    const timeoutId = window.setTimeout(() => setIsProcessing(false), 30_000)
    const completeProcessing = () => {
      clearTimeout(timeoutId)
      setIsProcessing(false)
    }

    try {
      const checkoutEmail = await resolveCheckoutEmail(user.email)
      const checkoutAmount = normalizeCheckoutAmount(totalPrice)
      const checkoutError = assertCheckoutReady(checkoutAmount, checkoutEmail)
      if (checkoutError) {
        alert(checkoutError)
        completeProcessing()
        return
      }

      const init = await initializePaystackPayment({
        amount: checkoutAmount,
        email: checkoutEmail,
        name: user.name || checkoutEmail.split("@")[0],
        courseIds: items.map((item) => String(item.id)),
        courseNames: items.map((item) => item.title).join(", "),
        userId: user.id,
        metadata: {
          isBulkCheckout: true,
          courseCount: items.length,
          paymentMethod,
        },
      })

      if (!init.success) throw new Error(init.error || "Failed to initialize payment")

      await openPaystackCheckout({
        email: checkoutEmail,
        amount: checkoutAmount,
        reference: init.reference!,
        authorizationUrl: init.authorizationUrl,
        onClose: () => completeProcessing(),
        onSuccess: (paidRef) => {
          setIsProcessing(false)
          void handlePaymentCallback(paidRef, completeProcessing)
        },
      })
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : "Checkout failed. Please try again.")
      completeProcessing()
    }
  }

  const handlePaymentCallback = async (reference: string, completeProcessing: () => void) => {
    setVerifyError(null)
    setIsVerifying(true)
    const count = items.length
    try {
      const verifyData = await verifyPaymentWithRetry(reference)
      if (!verifyData.success) throw new Error(verifyData.message || "Payment verification failed")

      setEnrollmentSuccess({ courseCount: count })
      setIsVerifying(false)
      completeProcessing()
      clearCart()

      void refreshUser({ retries: 3 }).catch((err) => {
        console.error("Post-checkout profile refresh failed:", err)
      })
    } catch (error) {
      console.error("Verification error:", error)
      setIsVerifying(false)
      completeProcessing()
      setVerifyError(
        error instanceof Error
          ? error.message
          : "Payment received but verification failed. Please contact support.",
      )
    }
  }

  if (enrollmentSuccess) {
    return (
      <EnrollmentSuccessView
        courseCount={enrollmentSuccess.courseCount}
        onContinue={onCheckoutSuccess}
      />
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center lg:py-24">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Your bag is empty</h1>
        <p className="mb-8 text-muted-foreground">
          Browse our catalog and add courses to start learning.
        </p>
        <Button onClick={onBrowseCourses} className="rounded-full px-8">
          Browse courses
        </Button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </button>

      <CheckoutStepper activeStep={activeStep} />

      <h1 className="mb-8 text-4xl font-bold uppercase tracking-tight sm:text-5xl lg:text-6xl">
        Checkout
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14 xl:grid-cols-[1fr_26rem]">
        {/* Left — cart + details */}
        <div className="space-y-10">
          {/* Cart items */}
          <section>
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Shopping bag · {items.length} {items.length === 1 ? "course" : "courses"}
            </h2>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-6 first:pt-0">
                  <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-20">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-primary/10">
                        <ShoppingBag className="h-6 w-6 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug line-clamp-2">{item.title}</h3>
                    {item.instructor && (
                      <p className="mt-1 text-xs text-muted-foreground">By {item.instructor}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove "${item.title}" from cart?`)) {
                            removeFromCart(item.id)
                          }
                        }}
                        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-earn sm:text-lg">
                    ₦{item.price.toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Information */}
          <section>
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your information
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <UnderlineField
                label="Full name"
                value={user?.name || ""}
                placeholder="Sign in to continue"
                readOnly
              />
              <UnderlineField
                label="Email"
                type="email"
                value={user?.email || ""}
                placeholder="Sign in to continue"
                readOnly
              />
            </div>
            {!user && (
              <p className="mt-4 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={onLoginRequired}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Sign in
                </button>{" "}
                to complete your purchase.
              </p>
            )}
          </section>

          {/* Payment method */}
          <section>
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Payment method
            </h2>
            <div className="space-y-0 divide-y divide-border border-y border-border">
              {(
                [
                  { id: "card" as const, label: "Credit / Debit Card", icon: CreditCard },
                  { id: "bank" as const, label: "Bank Transfer", icon: Lock },
                  { id: "ussd" as const, label: "USSD", icon: Smartphone },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">via Paystack</span>
                </label>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Instant course access after payment
            </p>
          </section>
        </div>

        {/* Right — summary sidebar */}
        <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Order summary
            </h2>

            <ul className="mb-5 max-h-48 space-y-3 overflow-y-auto text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-muted-foreground">{item.title}</span>
                  <span className="shrink-0 tabular-nums text-earn">
                    ₦{item.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-5 flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo code"
                className="h-10 rounded-lg border-border bg-muted/30 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-lg px-4 text-xs font-semibold uppercase"
                onClick={() => promoCode && alert("Promo codes coming soon.")}
              >
                Apply
              </Button>
            </div>

            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">₦{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Courses</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-primary">Free · Instant access</span>
              </div>
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
              <span className="text-sm font-semibold uppercase tracking-wide">Total</span>
              <span className="text-2xl font-bold tabular-nums text-earn sm:text-3xl">
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isProcessing || isVerifying}
              className="mt-6 h-12 w-full rounded-lg text-sm font-bold uppercase tracking-wide"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming…
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                "Pay and enroll"
              )}
            </Button>

            {verifyError && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {verifyError}
              </p>
            )}

            {isVerifying && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Verifying with Paystack — this can take up to 30 seconds.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear your entire cart?")) clearCart()
              }}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-destructive"
            >
              Clear cart
            </button>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Secured by Paystack
              </p>
              <p className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Card, bank &amp; USSD accepted
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom CTA strip — LINOGE-inspired */}
      <div className="mt-16 rounded-2xl bg-forest px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-medium uppercase tracking-widest text-white/60">
            Nexus Learning
          </p>
          <p className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            Start your learning journey today
          </p>
        </div>
      </div>
    </div>
  )
}
