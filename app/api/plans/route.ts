import { NextResponse } from "next/server"
import { PLAN_DEFINITIONS } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    plans: PLAN_DEFINITIONS.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      interval: p.interval,
      description: p.description,
      highlight: p.highlight,
      features: p.features,
      featureFlags: p.featureFlags,
    })),
  })
}
