import { NextResponse } from "next/server"
import { getTestimonials } from "@/lib/content-db"

export const dynamic = "force-dynamic"

export async function GET() {
  const testimonials = await getTestimonials()
  return NextResponse.json({ testimonials })
}
