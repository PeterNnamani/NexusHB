import { NextResponse } from "next/server"

export function adminJson(data: unknown, maxAgeSeconds = 30) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `private, max-age=${maxAgeSeconds}, stale-while-revalidate=60`,
    },
  })
}
