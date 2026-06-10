import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items: (data || []).map((s) => ({
      id: s.id,
      email: s.email,
      subscribedAt: s.created_at,
    })),
  })
}
