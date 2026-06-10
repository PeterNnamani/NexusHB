import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

/** Clears the Supabase session cookies on the server (required for SSR auth). */
export async function POST() {
  try {
    const supabase = await createClient()
    // Local scope — clears this session/cookies quickly (global revoke is slow).
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Supabase signOut error:", error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Logout route error:", err)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
