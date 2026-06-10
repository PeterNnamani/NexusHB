import type { PublicCourse } from "@/lib/courses-db"
import type { buildChatUserContext } from "@/lib/chat-context"
import { formatWebSearchForPrompt, type WebSearchHit } from "@/lib/web-search"

function formatPrice(price: number) {
  return price > 0 ? `₦${price.toLocaleString()}` : "Free"
}

function buildCourseContext(courses: PublicCourse[]): string {
  if (courses.length === 0) {
    return "No published courses in the catalog right now."
  }
  return courses
    .map(
      (c) =>
        `- ${c.title} (${formatPrice(c.price)})${c.category ? ` — ${c.category}` : ""}${
          c.level ? `, ${c.level}` : ""
        }${c.duration ? `, ${c.duration}` : ""}`,
    )
    .join("\n")
}

const CORE_IDENTITY = `You are Nexus AI — a universal intelligent assistant built into Nexus Hub, an online learning platform (Nigeria, Naira ₦, Paystack payments).

You are NOT limited to course content. You can help with anything:
- General knowledge, science, math, history, geography, culture, languages
- Programming, technology, career, business, health (informational only — not medical diagnosis)
- Creative writing, brainstorming, analysis, comparisons, step-by-step tutorials
- Current events and real-world facts (use WEB SEARCH RESULTS when provided)
- Nexus platform help: courses, enrollment, payments, dashboard, admin tools

Be accurate, helpful, and thorough. Use markdown (headings, lists, code blocks) when it improves clarity.
If web results conflict with your training data, prefer the web results for current facts.
If you are uncertain, say so briefly and give your best answer.`

export function buildLearningSystemPrompt(
  courses: PublicCourse[],
  ctx: Awaited<ReturnType<typeof buildChatUserContext>>,
  webHits: WebSearchHit[],
) {
  const enrolledSection =
    ctx && ctx.courseBlocks.length > 0
      ? `ENROLLED / PURCHASED COURSES (use when the user asks about their learning):
${ctx.courseBlocks.join("\n\n---\n\n")}`
      : "The user has no enrolled courses loaded, or none yet."

  const activeNote = ctx?.activeCourseTitle
    ? `The user is currently viewing course: "${ctx.activeCourseTitle}".`
    : ""

  return `${CORE_IDENTITY}

USER: ${ctx?.userName ?? "Guest"}${activeNote ? `\n${activeNote}` : ""}

WEB SEARCH RESULTS (live online data — cite or synthesize when relevant):
${formatWebSearchForPrompt(webHits)}

${enrolledSection}

PUBLIC COURSE CATALOG:
${buildCourseContext(courses)}

When the question is about Nexus courses, ground answers in the catalog/enrolled content above.
For everything else, answer freely using web results + your knowledge.`
}

export function buildTeachingSystemPrompt(
  courses: PublicCourse[],
  ctx: Awaited<ReturnType<typeof buildChatUserContext>>,
  webHits: WebSearchHit[],
) {
  const teachingSection =
    ctx && ctx.courseBlocks.length > 0
      ? `TUTOR'S COURSES (draft + published):
${ctx.courseBlocks.join("\n\n---\n\n")}`
      : "No owned courses loaded yet."

  return `${CORE_IDENTITY}

TUTOR: ${ctx?.userName ?? "Educator"}

WEB SEARCH RESULTS (live online data):
${formatWebSearchForPrompt(webHits)}

${teachingSection}

PUBLIC CATALOG:
${buildCourseContext(courses)}

PLATFORM TOOLS:
- Admin panel: /admin
- Courses: /admin/courses (curriculum import, publish, materials)
- News: /admin/news
- Finance, users, enrollments in admin sidebar

Help with course authoring AND any general question the tutor asks — research, coding, lesson ideas, current trends, etc.`
}

export function buildGeneralFallback(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes("nexus") || lower.includes("course") || lower.includes("enroll")) {
    return "I'm Nexus AI. I can answer any question — school topics, coding, current events, life advice, and also help with Nexus courses, payments (Paystack), and your dashboard. Add GROQ_API_KEY in .env.local for full AI responses."
  }

  return "I'm Nexus AI — ask me anything: homework help, coding, news, creative writing, or Nexus platform questions. Configure GROQ_API_KEY in .env.local to enable the full AI backend."
}
