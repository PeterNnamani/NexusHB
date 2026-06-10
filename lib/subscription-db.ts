import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"
import { createRestClient } from "@/lib/supabase-rest"
import {
  defaultFreePlanSlug,
  getPlanBySlug,
  hasLiveClassroomHostAccess,
  hasLiveClassroomJoinAccess,
  type PlanSlug,
} from "@/lib/plans"

export interface UserSubscription {
  planSlug: string
  planName: string
  status: string
  currentPeriodEnd: string
  featureFlags: Record<string, unknown>
  liveClassroom: boolean
  liveClassroomJoin: boolean
  audience: "student" | "tutor"
}

function resolveClient(supabase?: SupabaseClient): SupabaseClient {
  if (supabase) return supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && serviceKey) {
    return createClient(url, serviceKey, { auth: { persistSession: false } })
  }
  return createRestClient()
}

export async function getActiveSubscription(
  userId: string,
  supabase?: SupabaseClient,
): Promise<UserSubscription | null> {
  const client = resolveClient(supabase)

  const { data, error } = await client
    .from("user_subscriptions")
    .select(
      "status, current_period_end, subscription_plans(slug, name, feature_flags)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const rawPlan = data.subscription_plans
  const plan = (Array.isArray(rawPlan) ? rawPlan[0] : rawPlan) as {
    slug: string
    name: string
    feature_flags: Record<string, unknown>
  } | null

  if (!plan?.slug) return null

  const definition = getPlanBySlug(plan.slug)

  return {
    planSlug: plan.slug,
    planName: plan.name,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    featureFlags: plan.feature_flags || {},
    liveClassroom: hasLiveClassroomHostAccess(
      undefined,
      plan.slug,
      plan.feature_flags as never,
    ),
    liveClassroomJoin: hasLiveClassroomJoinAccess(
      undefined,
      plan.slug,
      plan.feature_flags as never,
    ),
    audience: definition?.audience || "student",
  }
}

export interface SubscriptionSummary {
  subscription: UserSubscription | null
  effectivePlanSlug: PlanSlug
  effectivePlanName: string
  isPaid: boolean
}

export async function getSubscriptionSummary(
  userId: string,
  accountRole?: string,
  supabase?: SupabaseClient,
): Promise<SubscriptionSummary> {
  const subscription = await getActiveSubscription(userId, supabase)
  if (subscription) {
    return {
      subscription,
      effectivePlanSlug: subscription.planSlug as PlanSlug,
      effectivePlanName: subscription.planName,
      isPaid: true,
    }
  }

  const freeSlug = defaultFreePlanSlug(accountRole)
  const freePlan = getPlanBySlug(freeSlug)
  return {
    subscription: null,
    effectivePlanSlug: freeSlug,
    effectivePlanName: freePlan?.name || "Learner",
    isPaid: false,
  }
}

export async function userCanHostLiveClassroom(
  userId: string,
  accountRole?: string,
  supabase?: SupabaseClient,
): Promise<boolean> {
  if (accountRole === "admin") return true
  const sub = await getActiveSubscription(userId, supabase)
  return hasLiveClassroomHostAccess(accountRole, sub?.planSlug, sub?.featureFlags as never)
}

export async function userCanJoinLiveClassroom(
  userId: string,
  accountRole?: string,
  supabase?: SupabaseClient,
): Promise<boolean> {
  if (accountRole === "admin") return true
  const sub = await getActiveSubscription(userId, supabase)
  return hasLiveClassroomJoinAccess(accountRole, sub?.planSlug, sub?.featureFlags as never)
}
