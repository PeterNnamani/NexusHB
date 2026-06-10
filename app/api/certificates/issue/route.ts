import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerSupabaseClient } from "@/lib/supabase-server"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { checkCertificateEligibility } from "@/lib/certificate-eligibility"

export async function POST(request: NextRequest) {
  const { courseId } = await request.json().catch(() => ({}))
  if (!courseId) {
    return NextResponse.json({ success: false, message: "courseId is required" }, { status: 400 })
  }

  const serverSupabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await serverSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  let admin
  try {
    admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server configuration error"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }

  const eligibility = await checkCertificateEligibility(admin, user.id, String(courseId))
  if (!eligibility.eligible) {
    return NextResponse.json({ success: false, message: eligibility.reason }, { status: 403 })
  }

  const { data: existing } = await admin
    .from("certificates")
    .select("id, certificate_no")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, certificate: existing })
  }

  const certificateNo = `NX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

  const { data, error } = await admin
    .from("certificates")
    .insert({ user_id: user.id, course_id: courseId, certificate_no: certificateNo })
    .select("id, certificate_no")
    .single()

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, certificate: data })
}
