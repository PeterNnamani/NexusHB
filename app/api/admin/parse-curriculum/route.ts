import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { requireContentAuth } from "@/lib/admin-auth"
import {
  mergeCurriculum,
  normalizeParsedCurriculum,
  parseCurriculumFallback,
  parseCurriculumJsonFromAi,
  type ParsedCurriculum,
} from "@/lib/parse-curriculum"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  const auth = await requireContentAuth()
  if ("error" in auth) return auth.error

  let body: { rawText?: string; courseTitle?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : ""
  if (!rawText) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 })
  }

  const MAX_INPUT = 16_000
  const trimmedText =
    rawText.length > MAX_INPUT
      ? `${rawText.slice(0, MAX_INPUT)}\n\n[Truncated for speed — first ${MAX_INPUT} characters]`
      : rawText

  const fallback = parseCurriculumFallback(trimmedText)

  if (!openai) {
    return NextResponse.json({
      curriculum: fallback,
      source: "fallback",
      lessonCount: fallback.lessons.length,
      assignmentCount: fallback.lessons.filter((l) => l.assignment).length,
      hasProject: !!fallback.project,
    })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 4500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Structure pasted curriculum into JSON:
{
  "lessons": [{
    "title", "week", "duration", "videoUrl", "topics": [],
    "materials": [{"title","content","url","type"}],
    "assignment": {"title","description","format"},
    "quiz": {"title","numQuestions","description"}
  }],
  "project": {"title","description","instructions","format"}
}
Input formats supported:
- Markdown headers: "## Week N: Title" (or # Week N) with sections "### Topics", "### Video", "### Duration", "### Materials", "### Assignment", "### Quiz"
- Plain text: "Week N: Title" with "Topics:", "Materials:", etc.
- Week separators: "---" between weeks
- Course title line at top (no week number) — ignore, not a lesson
- Final block: "# Final Capstone Project" → root "project" (NOT a lesson)

Rules:
- One lesson per Week/Module. ### Topics bullets → topics array.
- ### Materials paragraph → one document material with full text in "content".
- ### Assignment bullets → assignment.description (bullet list). assignment.title = "Week N Assignment".
- ### Quiz numbered questions (1. 2. 3.) → quiz.title = "Week N Quiz", quiz.numQuestions = count, quiz.description = all questions joined with newlines.
- ### Video markdown links or URLs → videoUrl. ### Duration "60 Minutes" → duration field.
- Final Capstone: project.title from "## Project Title", project.instructions = full capstone body (requirements, deliverables, evaluation).
- Keep ALL weeks. No extra text outside JSON.`,
        },
        {
          role: "user",
          content: body.courseTitle
            ? `Course: ${body.courseTitle}\n\n${trimmedText}`
            : trimmedText,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) throw new Error("Empty AI response")

    const parsed = parseCurriculumJsonFromAi(content)
    const base: ParsedCurriculum =
      parsed && parsed.lessons.length > 0 ? parsed : fallback
    const curriculum = mergeCurriculum(base, fallback)

    return NextResponse.json({
      curriculum,
      source: parsed && parsed.lessons.length > 0 ? "ai" : "fallback",
      lessonCount: curriculum.lessons.length,
      assignmentCount: curriculum.lessons.filter((l) => l.assignment).length,
      hasProject: !!curriculum.project,
    })
  } catch (error) {
    console.error("parse-curriculum error:", error)
    return NextResponse.json({
      curriculum: fallback,
      source: "fallback",
      lessonCount: fallback.lessons.length,
      assignmentCount: fallback.lessons.filter((l) => l.assignment).length,
      hasProject: !!fallback.project,
    })
  }
}
