import { NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()

  const [contactRes, sugRes] = await Promise.all([
    admin
      .from("contact_submissions")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("suggestions")
      .select("id, name, email, category, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  if (contactRes.error) {
    return NextResponse.json({ error: contactRes.error.message }, { status: 500 })
  }
  if (sugRes.error) {
    return NextResponse.json({ error: sugRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    contacts: contactRes.data || [],
    suggestions: sugRes.data || [],
  })
}
