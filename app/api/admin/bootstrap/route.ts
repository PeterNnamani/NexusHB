import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "User role bootstrap is disabled. Platform admins sign in at /admin/login using ADMIN_EMAIL and ADMIN_PASSWORD.",
    },
    { status: 410 },
  )
}
