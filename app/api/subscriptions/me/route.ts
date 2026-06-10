import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getSubscriptionSummary } from "@/lib/subscription-db"
import { hasLiveClassroomHostAccess, hasLiveClassroomJoinAccess } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role || "student"
  const summary = await getSubscriptionSummary(user.id, role, supabase)

  return NextResponse.json({
    subscription: summary.subscription,
    effectivePlanSlug: summary.effectivePlanSlug,
    effectivePlanName: summary.effectivePlanName,
    isPaid: summary.isPaid,
    liveClassroom: hasLiveClassroomHostAccess(
      role,
      summary.subscription?.planSlug,
      summary.subscription?.featureFlags as never,
    ),
    liveClassroomJoin: hasLiveClassroomJoinAccess(
      role,
      summary.subscription?.planSlug,
      summary.subscription?.featureFlags as never,
    ),
    role,
  })
}
