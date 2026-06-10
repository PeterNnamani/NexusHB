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
    const { analytics } = await withServerCache("admin:overview", ADMIN_CACHE_TTL_MS, async () =>
      loadAdminOverviewData(getAdminDb()),
    )
    return adminJson(analytics)
  } catch (error) {
    console.error("admin analytics error:", error)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
