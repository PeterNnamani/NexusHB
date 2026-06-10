"use client"

import {
  ArrowRight,
  CreditCard,
  GraduationCap,
  RefreshCw,
  Shield,
  Users,
  Wallet,
  BookOpen,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FINANCE_RULES } from "@/lib/finance"

const flows = [
  {
    title: "Course purchase",
    icon: BookOpen,
    steps: [
      "Student adds course to cart and checks out via Paystack",
      "Order created with status pending and unique reference",
      "Paystack webhook or verify-payment confirms charge.success",
      "Order marked paid; enrollment created; payment logged",
      "Revenue split: 15% platform · 70% tutor · 15% student reserve",
    ],
  },
  {
    title: "Subscription upgrade",
    icon: Zap,
    steps: [
      "User selects Learner Plus, Tutor, or Agent plan",
      "Order course_id is plan:<slug> (e.g. plan:tutor_plus)",
      "On success, user_subscriptions row activated for 30 days",
      "Role upgraded to tutor when applicable",
      "100% of subscription fee counts as platform revenue",
    ],
  },
  {
    title: "Student payout reserve",
    icon: GraduationCap,
    steps: [
      "Each course has an earnings_potential (max student reward)",
      "15% of every course sale is allocated to the student reserve pool",
      "Per enrollment: reserve += earnings_potential × progress% × 15%",
      "Funds are held until milestones are verified and paid out",
      "Visible in Finance → Student reserves tab",
    ],
  },
  {
    title: "Staff (tutor) credits",
    icon: Users,
    steps: [
      "Course instructor_id links payment to the tutor",
      "70% of each successful course payment credited to instructor",
      "Credits accumulate in Finance → Staff credits",
      "Tutors view earnings on their dashboard",
      "Payout disbursement is tracked here; manual transfer via Paystack",
    ],
  },
  {
    title: "Payment verification",
    icon: RefreshCw,
    steps: [
      "Primary: Paystack webhook POST /api/payments/webhook",
      "Fallback: GET /api/verify-payment?reference=…",
      "Callback: /api/payments/paystack-callback after redirect",
      "lib/payment-fulfillment.ts handles enrollment + logging",
      "Failed/abandoned orders stay pending; no fulfillment",
    ],
  },
  {
    title: "Access & roles",
    icon: Shield,
    steps: [
      "student — enroll, learn, earn milestone rewards",
      "tutor — create courses, host live sessions, earn credits",
      "admin — full platform control, finance, users, and seed tools",
      "Middleware requires auth; staff role checked in AdminShell",
    ],
  },
]

const splitItems = [
  { label: "Platform fee", rate: `${FINANCE_RULES.platformFeeRate * 100}%`, desc: "Operations, hosting, support" },
  { label: "Tutor credit", rate: `${FINANCE_RULES.tutorShareRate * 100}%`, desc: "Instructor share per course sale" },
  { label: "Student reserve", rate: `${FINANCE_RULES.studentReserveRate * 100}%`, desc: "Held for milestone payouts" },
]

export function AdminOperations() {
  return (
    <div className="space-y-10 w-full max-w-[1400px]">
      <AdminPageHeader
        title="Platform Operations"
        description="How money moves through Nexus — from checkout to enrollment, reserves, and staff credits."
      />

      <div className="grid sm:grid-cols-3 gap-4">
        {splitItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <Badge variant="outline" className="font-mono text-sm">
                {item.rate}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="h-5 w-5" />
          <div>
            <h2 className="text-lg font-semibold">Money flow diagram</h2>
            <p className="text-sm text-muted-foreground">End-to-end path for a typical course sale</p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-3 lg:gap-2">
          {[
            { label: "Paystack", sub: "Customer pays" },
            { label: "Orders", sub: "pending → paid" },
            { label: "Payments", sub: "success log" },
            { label: "Split", sub: "15 / 70 / 15" },
            { label: "Fulfill", sub: "enrollment" },
          ].map((node, i, arr) => (
            <div key={node.label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-center min-w-0">
                <p className="font-semibold text-sm">{node.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{node.sub}</p>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {flows.map((flow) => {
          const Icon = flow.icon
          return (
            <div key={flow.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold">{flow.title}</h3>
              </div>
              <ol className="space-y-2.5">
                {flow.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Database tables</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { table: "orders", role: "Checkout intent — pending until Paystack confirms" },
            { table: "payments", role: "Immutable success log with amount & reference" },
            { table: "enrollments", role: "Active course access + progress %" },
            { table: "user_subscriptions", role: "Plan status and billing period" },
            { table: "courses", role: "Price, instructor, earnings_potential" },
            { table: "users", role: "Roles, enrolled_courses projection" },
          ].map((t) => (
            <div key={t.table} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <code className="text-sm font-semibold">{t.table}</code>
              <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
