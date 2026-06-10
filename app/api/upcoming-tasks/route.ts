import { NextResponse } from "next/server"
import { createClient as createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, title, type, start_at")
      .eq("user_id", user.id)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5)

    if (error) throw error

    const tasks = (data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      deadline: e.start_at,
    }))

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to load upcoming tasks:", error)
    return NextResponse.json([])
  }
}
