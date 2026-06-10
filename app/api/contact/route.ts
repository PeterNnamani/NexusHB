import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`contact:${clientIpFromRequest(request)}`, 8, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  try {
    const body = await request.json()
    const { name, email, subject, message, topic } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })

    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      subject: subject || topic || null,
      message,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact submission failed:", error)
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 })
  }
}
