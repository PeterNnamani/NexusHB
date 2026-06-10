import type { SupabaseClient } from "@supabase/supabase-js"
import type { ContentAuth } from "@/lib/admin-auth"
import { isPlatformContentAdmin } from "@/lib/admin-auth"
export function normalizeInstructorEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase()
}

/** Platform operator email from env (separate /admin login). */
export function getPlatformAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim()
  return email ? normalizeInstructorEmail(email) : null
}

export function emailsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeInstructorEmail(a)
  const right = normalizeInstructorEmail(b)
  return Boolean(left && right && left === right)
}

/** True when platform admin email matches the signed-in staff profile email. */
export function staffSharesPlatformAdminEmail(staffEmail: string | null | undefined): boolean {
  const platformEmail = getPlatformAdminEmail()
  if (!platformEmail) return false
  return emailsMatch(platformEmail, staffEmail)
}

export async function getUserIdsForEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string[]> {
  const normalized = normalizeInstructorEmail(email)
  if (!normalized) return []

  const { data } = await admin.from("users").select("id").eq("email", normalized)
  return (data || []).map((row) => row.id)
}

/** User ids whose courses this staff member may manage in the created-courses area. */
export async function resolveOwnedInstructorIds(
  admin: SupabaseClient,
  auth: ContentAuth,
): Promise<string[]> {
  if (isPlatformContentAdmin(auth)) return []

  const profile = auth.profile
  const profileEmail = normalizeInstructorEmail(profile.email)

  if (staffSharesPlatformAdminEmail(profileEmail)) {
    const linked = await getUserIdsForEmail(admin, profileEmail)
    if (linked.length > 0) return linked
  }

  return [profile.id]
}

export async function resolveInstructorIdForCourseCreate(
  admin: SupabaseClient,
  auth: ContentAuth,
): Promise<string | null> {
  if (auth.kind === "staff") {
    return auth.profile.id
  }

  const platformEmail = normalizeInstructorEmail(auth.session.email)
  if (!platformEmail) return null

  const linked = await getUserIdsForEmail(admin, platformEmail)
  return linked[0] ?? null
}

export async function staffCanManageCourse(
  admin: SupabaseClient,
  auth: ContentAuth,
  instructorId: string | null | undefined,
): Promise<boolean> {
  if (isPlatformContentAdmin(auth)) return true
  if (!instructorId) return false

  const ownedIds = await resolveOwnedInstructorIds(admin, auth)
  return ownedIds.includes(instructorId)
}
