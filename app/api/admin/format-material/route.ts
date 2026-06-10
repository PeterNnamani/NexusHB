import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { requireContentAuth } from "@/lib/admin-auth"
import { formatMaterialFallback } from "@/lib/format-material"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: { rawText?: string; title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""

  if (!rawText) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 })
  }

  const fallback = formatMaterialFallback(rawText, title || undefined)

  if (!openai) {
    return NextResponse.json({
      formatted: fallback,
      title: title || rawText.split("\n")[0]?.slice(0, 80) || "Course material",
      source: "fallback",
    })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You format tutor course materials into clean Markdown for students. Keep ALL facts and teaching content from the source — do not invent new information. Add:
- A clear # title
- ## section headers
- Bullet lists where appropriate
- **Bold** for key terms
- Short intro and summary if missing
Return ONLY the formatted Markdown, no preamble.`,
        },
        {
          role: "user",
          content: title
            ? `Title: ${title}\n\nRaw notes:\n${rawText}`
            : `Raw notes:\n${rawText}`,
        },
      ],
    })

    const formatted = completion.choices[0]?.message?.content?.trim()
    if (!formatted) throw new Error("Empty AI response")

    return NextResponse.json({
      formatted,
      title: title || formatted.match(/^#\s+(.+)$/m)?.[1] || "Course material",
      source: "ai",
    })
  } catch (error) {
    console.error("format-material error:", error)
    return NextResponse.json({
      formatted: fallback,
      title: title || "Course material",
      source: "fallback",
    })
  }
}
