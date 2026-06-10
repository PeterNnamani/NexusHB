import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`newsletter:${clientIpFromRequest(request)}`, 10, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  try {
    const body = await request.json()
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error } = await admin.from("newsletter_subscribers").insert({ email: rawEmail })

    if (error) {
      // Already subscribed — treat as success
      if (error.code === "23505") {
        return NextResponse.json({ success: true, alreadySubscribed: true })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter subscription failed:", error)
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 })
  }
}
