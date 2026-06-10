import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { isStaffRole, normalizeRole } from "@/lib/admin"
import { getAdminSessionFromCookies, type AdminSession } from "@/lib/admin-session"

export type StaffProfile = {
  id: string
  role: string
  email?: string
  name?: string
}

export type ContentAuth =
  | { kind: "platform"; session: AdminSession }
  | { kind: "staff"; profile: StaffProfile }

export function getAdminDb() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  })
}

/** Platform operator session (independent of Supabase user accounts). */
export async function requirePlatformAdmin(): Promise<
  { session: AdminSession } | { error: NextResponse }
> {
  const session = await getAdminSessionFromCookies()
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session }
}

/** @deprecated Use requirePlatformAdmin — alias for existing admin API routes. */
export async function requireAdmin(): Promise<
  { session: AdminSession } | { error: NextResponse }
> {
  return requirePlatformAdmin()
}

/** Signed-in tutor via main app auth (dashboard course tools). */
export async function requireStaff(): Promise<
  { profile: StaffProfile } | { error: NextResponse }
> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, email, name")
    .eq("id", user.id)
    .maybeSingle()

  const role = normalizeRole(profile?.role)
  if (!profile || !isStaffRole(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { profile: { ...profile, role } as StaffProfile }
}

/** Admin panel or tutor dashboard content APIs (courses, news, lessons, materials). */
export async function requireContentAuth(): Promise<ContentAuth | { error: NextResponse }> {
  const session = await getAdminSessionFromCookies()
  if (session) return { kind: "platform", session }

  const staff = await requireStaff()
  if ("error" in staff) return staff
  return { kind: "staff", profile: staff.profile }
}

export function isPlatformContentAdmin(auth: ContentAuth): boolean {
  return auth.kind === "platform"
}
