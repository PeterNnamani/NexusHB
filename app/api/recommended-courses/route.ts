import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category, image, price, rating")
      .eq("status", "published")
      .order("rating", { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Failed to load recommended courses:", error)
    return NextResponse.json([])
  }
}
