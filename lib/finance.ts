import { parsePlanSlugFromOrderId } from "@/lib/plans"

/** Platform revenue-share rules (documented in admin Operations). */
export const FINANCE_RULES = {
  platformFeeRate: 0.15,
  tutorShareRate: 0.7,
  studentReserveRate: 0.15,
  /** Fraction of earnings_potential reserved per active enrollment (progress-weighted). */
  studentPayoutProgressWeight: 1,
} as const

export type PaymentCategory = "course" | "subscription" | "unknown"

export function categorizePayment(courseId: string | null): PaymentCategory {
  if (!courseId) return "subscription"
  if (courseId.startsWith("plan:")) return "subscription"
  return "course"
}

export function splitCoursePayment(amount: number) {
  const { platformFeeRate, tutorShareRate, studentReserveRate } = FINANCE_RULES
  return {
    gross: amount,
    platformFee: roundMoney(amount * platformFeeRate),
    tutorCredit: roundMoney(amount * tutorShareRate),
    studentReserve: roundMoney(amount * studentReserveRate),
  }
}

export function splitSubscriptionPayment(amount: number) {
  return {
    gross: amount,
    platformFee: roundMoney(amount),
    tutorCredit: 0,
    studentReserve: 0,
  }
}

export function splitPayment(amount: number, courseId: string | null) {
  const category = categorizePayment(courseId)
  if (category === "course") return { category, ...splitCoursePayment(amount) }
  return { category: "subscription" as const, ...splitSubscriptionPayment(amount) }
}

export function computeStudentReserve(
  earningsPotential: number,
  progress: number,
): number {
  const pct = Math.min(100, Math.max(0, progress)) / 100
  return roundMoney(
    earningsPotential * pct * FINANCE_RULES.studentReserveRate * FINANCE_RULES.studentPayoutProgressWeight,
  )
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function fmtNaira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function lastNMonths(n: number): string[] {
  const keys: string[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    keys.push(monthKey(m))
  }
  return keys
}

export function planLabelFromCourseId(courseId: string | null): string | null {
  if (!courseId) return null
  const slug = parsePlanSlugFromOrderId(courseId)
  if (!slug) return null
  return slug.replace(/_/g, " ")
}
