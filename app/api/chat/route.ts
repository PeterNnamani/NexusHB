import { NextRequest, NextResponse } from "next/server"
import type OpenAI from "openai"
import { getPublicCourses } from "@/lib/courses-db"
import { buildChatUserContext } from "@/lib/chat-context"
import {
  buildGeneralFallback,
  buildLearningSystemPrompt,
  buildTeachingSystemPrompt,
} from "@/lib/chat-prompts"
import { getChatLlmClient } from "@/lib/llm-client"
import { checkRateLimit, clientIpFromRequest, rateLimitResponse } from "@/lib/rate-limit"
import { searchWeb } from "@/lib/web-search"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`chat:${clientIpFromRequest(request)}`, 30, 60_000)
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSec)

  let message = ""
  let history: { role: string; content: string }[] = []
  let mode: "learning" | "teaching" = "learning"
  let userId: string | undefined
  let userName: string | undefined
  let activeCourseId: string | null = null

  try {
    const body = await request.json()
    message = body.message || ""
    history = Array.isArray(body.history) ? body.history : []
    if (body.mode === "teaching") mode = "teaching"
    if (typeof body.userId === "string") userId = body.userId
    if (typeof body.userName === "string") userName = body.userName
    if (typeof body.activeCourseId === "string") activeCourseId = body.activeCourseId
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const [courses, userCtx, webHits] = await Promise.all([
    getPublicCourses().catch(() => []),
    userId
      ? buildChatUserContext({
          userId,
          userName,
          mode,
          activeCourseId,
        }).catch(() => null)
      : Promise.resolve(null),
    searchWeb(message).catch(() => []),
  ])

  const fallback = buildGeneralFallback(message)

  const llm = getChatLlmClient()
  if (!llm) {
    return NextResponse.json({ response: fallback })
  }

  const systemPrompt =
    mode === "teaching"
      ? buildTeachingSystemPrompt(courses, userCtx, webHits)
      : buildLearningSystemPrompt(courses, userCtx, webHits)

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const completion = await llm.client.chat.completions.create({
      model: llm.model,
      messages,
      max_tokens: 1600,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error("No response from LLM")

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ response: fallback })
  }
}
