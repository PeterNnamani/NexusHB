import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { verifyAndFulfill } from "@/lib/payment-fulfillment"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(`verify-pay:${clientIpFromRequest(request)}`, 30, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")

  if (!reference) {
    return NextResponse.json({ success: false, message: "Reference is required" }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await verifyAndFulfill(reference, { expectedUserId: user.id })
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
