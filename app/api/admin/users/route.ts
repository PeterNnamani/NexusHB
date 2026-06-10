import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const admin = getAdminDb()
  const { data, error } = await admin
    .from("users")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data || [] })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  let body: { userId?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { userId, role } = body
  const allowedRoles = ["student", "tutor", "admin"]

  if (!userId || !role || !allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 })
  }

  const admin = getAdminDb()
  const { error } = await admin.from("users").update({ role }).eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
