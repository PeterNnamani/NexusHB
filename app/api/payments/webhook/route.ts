import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { verifyAndFulfill } from "@/lib/payment-fulfillment"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`webhook:${clientIpFromRequest(request)}`, 120, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  try {
    const body = await request.text()
    const signature = (await headers()).get("x-paystack-signature")

    if (!PAYSTACK_SECRET_KEY) {
      if (process.env.NODE_ENV === "production") {
        console.error("PAYSTACK_SECRET_KEY is not configured — rejecting webhook")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
      }
      console.warn("PAYSTACK_SECRET_KEY missing — webhook signature not verified (dev only)")
    } else {
      const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex")
      if (!signature || hash !== signature) {
        console.warn("Webhook signature verification failed")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === "charge.success") {
      const reference = event?.data?.reference
      if (reference) {
        const result = await verifyAndFulfill(reference)
        return NextResponse.json({
          status: result.success ? "ok" : "failed",
          message: result.message,
        })
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
