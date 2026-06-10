export type PlanSlug =
  | "learner"
  | "learner_plus"
  | "learner_pro"
  | "tutor"
  | "tutor_plus"

export type PlanAudience = "student" | "tutor"

export const SUBSCRIPTION_ORDER_PREFIX = "plan:"

export interface PlanFeatureFlags {
  live_classroom: boolean
  live_classroom_join: boolean
  max_courses: number
  premium_analytics: boolean
  agency_dashboard: boolean
  priority_support: boolean
  certificates: boolean
  offline_downloads: boolean
}

export interface PlanDefinition {
  slug: PlanSlug
  name: string
  price: number
  interval: "month"
  audience: PlanAudience
  description: string
  highlight: boolean
  purchasable: boolean
  features: string[]
  featureFlags: PlanFeatureFlags
  roleUpgrade?: "tutor" | "admin"
}

const DEFAULT_FLAGS: PlanFeatureFlags = {
  live_classroom: false,
  live_classroom_join: false,
  max_courses: 0,
  premium_analytics: false,
  agency_dashboard: false,
  priority_support: false,
  certificates: false,
  offline_downloads: false,
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    slug: "learner",
    name: "Learner",
    price: 0,
    interval: "month",
    audience: "student",
    description: "Free access to enrolled courses and community features.",
    highlight: false,
    purchasable: false,
    features: [
      "Access enrolled courses",
      "Tasks & milestones",
      "Community leaderboard",
      "Basic progress tracking",
    ],
    featureFlags: { ...DEFAULT_FLAGS },
  },
  {
    slug: "learner_plus",
    name: "Learner Plus",
    price: 4500,
    interval: "month",
    audience: "student",
    description: "Level up your learning with live classes and certificates.",
    highlight: true,
    purchasable: true,
    features: [
      "Join Nexus Live Classroom sessions",
      "Verified course certificates",
      "Offline lesson downloads",
      "Priority Q&A on courses",
    ],
    featureFlags: {
      ...DEFAULT_FLAGS,
      live_classroom_join: true,
      certificates: true,
      offline_downloads: true,
      priority_support: true,
    },
  },
  {
    slug: "learner_pro",
    name: "Learner Pro",
    price: 8500,
    interval: "month",
    audience: "student",
    description: "Maximum support for serious learners.",
    highlight: false,
    purchasable: true,
    features: [
      "Everything in Learner Plus",
      "1-on-1 mentor check-ins",
      "Advanced progress analytics",
      "Early access to new courses",
    ],
    featureFlags: {
      ...DEFAULT_FLAGS,
      live_classroom_join: true,
      certificates: true,
      offline_downloads: true,
      premium_analytics: true,
      priority_support: true,
    },
  },
  {
    slug: "tutor",
    name: "Tutor",
    price: 12000,
    interval: "month",
    audience: "tutor",
    description: "Start teaching and earn from your first students.",
    highlight: false,
    purchasable: true,
    features: [
      "Course builder & analytics",
      "Up to 5 active courses",
      "Basic student support",
      "Task-based learning tools",
    ],
    featureFlags: {
      ...DEFAULT_FLAGS,
      max_courses: 5,
    },
    roleUpgrade: "tutor",
  },
  {
    slug: "tutor_plus",
    name: "Tutor Plus",
    price: 22000,
    interval: "month",
    audience: "tutor",
    description: "Best for growing tutors — includes Nexus Live Classroom hosting.",
    highlight: true,
    purchasable: true,
    features: [
      "Everything in Tutor",
      "Host Nexus Live Classroom sessions",
      "Unlimited active courses",
      "Premium analytics dashboard",
      "Priority support",
    ],
    featureFlags: {
      ...DEFAULT_FLAGS,
      live_classroom: true,
      max_courses: -1,
      premium_analytics: true,
      priority_support: true,
    },
    roleUpgrade: "tutor",
  },
]

export function getPlanBySlug(slug: string): PlanDefinition | undefined {
  return PLAN_DEFINITIONS.find((p) => p.slug === slug)
}

export function planOrderId(slug: PlanSlug): string {
  return `${SUBSCRIPTION_ORDER_PREFIX}${slug}`
}

export function parsePlanSlugFromOrderId(orderCourseId: string): PlanSlug | null {
  if (!orderCourseId.startsWith(SUBSCRIPTION_ORDER_PREFIX)) return null
  const slug = orderCourseId.slice(SUBSCRIPTION_ORDER_PREFIX.length) as PlanSlug
  return getPlanBySlug(slug) ? slug : null
}

export function isTeachingRole(role: string | undefined): boolean {
  return role === "tutor" || role === "admin"
}

export type PlanView = "student" | "tutor"

/** Plans shown on the upgrade page for this account role. */
export function plansForAccountRole(role: string | undefined): PlanDefinition[] {
  if (isTeachingRole(role)) {
    return PLAN_DEFINITIONS.filter((p) => p.audience === "tutor" && p.purchasable)
  }
  return PLAN_DEFINITIONS.filter((p) => p.audience === "student" && p.purchasable)
}

/** Plans shown on upgrade page; students can preview tutor plans via view=tutor. */
export function plansForUpgradeView(
  view: PlanView,
  accountRole: string | undefined,
): PlanDefinition[] {
  if (isTeachingRole(accountRole)) {
    return PLAN_DEFINITIONS.filter((p) => p.audience === "tutor" && p.purchasable)
  }
  if (view === "tutor") {
    return PLAN_DEFINITIONS.filter((p) => p.audience === "tutor" && p.purchasable)
  }
  return PLAN_DEFINITIONS.filter((p) => p.audience === "student" && p.purchasable)
}

export function canPurchasePlan(accountRole: string | undefined, planSlug: PlanSlug): boolean {
  const plan = getPlanBySlug(planSlug)
  if (!plan?.purchasable) return false
  // Students may subscribe to tutor plans — role upgrades on fulfillment.
  if (plan.audience === "tutor") return true
  return !isTeachingRole(accountRole) && plan.audience === "student"
}

export function defaultFreePlanSlug(role: string | undefined): PlanSlug {
  return isTeachingRole(role) ? "tutor" : "learner"
}

export function hasLiveClassroomHostAccess(
  accountRole: string | undefined,
  planSlug: string | null | undefined,
  featureFlags?: Partial<PlanFeatureFlags> | null,
): boolean {
  if (accountRole === "admin") return true
  if (featureFlags?.live_classroom) return true
  if (planSlug) {
    const plan = getPlanBySlug(planSlug)
    if (plan?.featureFlags.live_classroom) return true
  }
  return false
}

export function hasLiveClassroomJoinAccess(
  accountRole: string | undefined,
  planSlug: string | null | undefined,
  featureFlags?: Partial<PlanFeatureFlags> | null,
): boolean {
  if (hasLiveClassroomHostAccess(accountRole, planSlug, featureFlags)) return true
  if (featureFlags?.live_classroom_join) return true
  if (planSlug) {
    const plan = getPlanBySlug(planSlug)
    if (plan?.featureFlags.live_classroom_join) return true
  }
  return false
}

/** @deprecated Use hasLiveClassroomHostAccess */
export function hasLiveClassroomAccess(
  accountRole: string | undefined,
  planSlug: string | null | undefined,
  featureFlags?: Partial<PlanFeatureFlags> | null,
): boolean {
  return hasLiveClassroomHostAccess(accountRole, planSlug, featureFlags)
}
