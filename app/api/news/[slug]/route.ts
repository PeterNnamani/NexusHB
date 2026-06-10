import { NextRequest, NextResponse } from "next/server"
import { getNewsBySlug } from "@/lib/content-db"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ article })
}
