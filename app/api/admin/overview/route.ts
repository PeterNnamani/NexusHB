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
    const data = await withServerCache("admin:overview", ADMIN_CACHE_TTL_MS, async () => {
      const admin = getAdminDb()
      return loadAdminOverviewData(admin)
    })
    return adminJson(data)
  } catch (error) {
    console.error("admin overview error:", error)
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 })
  }
}
