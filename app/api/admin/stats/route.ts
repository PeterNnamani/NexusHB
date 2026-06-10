import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"
import { loadAdminOverviewData } from "@/lib/admin-overview-data"
import { ADMIN_CACHE_TTL_MS, withServerCache } from "@/lib/server-cache"
import { adminJson } from "@/lib/admin-json-response"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  try {
    const { analytics, tables } = await withServerCache("admin:overview", ADMIN_CACHE_TTL_MS, async () =>
      loadAdminOverviewData(getAdminDb()),
    )

    return adminJson({
      totalUsers: analytics.summary.totalUsers,
      totalCourses: tables.totalCourses,
      publishedCourses: analytics.summary.publishedCourses,
      pendingApprovals: analytics.summary.draftCourses,
      totalRevenue: tables.totalRevenue,
      monthlyRevenue: tables.monthlyRevenue,
      newRegistrations: analytics.summary.newRegistrations,
      contactSubmissions: analytics.summary.contactSubmissions,
      suggestions: analytics.summary.suggestions,
      activeEnrollments: analytics.summary.activeEnrollments,
      activeSubscriptions: analytics.summary.activeSubscriptions,
      pendingOrders: analytics.summary.pendingOrders,
      usersByRole: analytics.usersByRole,
      revenueChart: analytics.revenueChart,
      signupsChart: analytics.signupsChart,
      roleChart: analytics.roleChart,
      recentPayments: tables.recentPayments,
      pendingOrdersList: tables.pendingOrdersList,
      topCourses: analytics.topCourses.slice(0, 6),
      recentUsers: tables.recentUsers,
    })
  } catch (error) {
    console.error("admin stats error:", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
