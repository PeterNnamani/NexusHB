import { NextRequest, NextResponse } from "next/server"
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-session"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`admin-login:${clientIpFromRequest(request)}`, 10, 15 * 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin auth is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in .env.local.",
      },
      { status: 503 },
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
  }

  const token = await createAdminSessionToken(email)
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 })
  }

  const response = NextResponse.json({
    success: true,
    email: email.trim().toLowerCase(),
  })
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions())
  return response
}
