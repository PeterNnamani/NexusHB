import { NextResponse } from "next/server"
import { getNews } from "@/lib/content-db"

export const dynamic = "force-dynamic"

export async function GET() {
  const news = await getNews()
  return NextResponse.json({ news })
}
