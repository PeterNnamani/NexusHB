export interface ParsedMaterial {
  title: string
  content?: string
  url?: string
  type?: "document" | "link"
}

export interface ParsedQuiz {
  title: string
  numQuestions?: number
  description?: string
}

export interface ParsedAssignment {
  title: string
  description: string
  format?: string
}

export interface ParsedProject {
  title: string
  description?: string
  instructions?: string
  format?: string
}

export interface ParsedLesson {
  title: string
  week?: number
  duration?: string
  videoTitle?: string
  videoUrl?: string
  topics: string[]
  materials?: ParsedMaterial[]
  quiz?: ParsedQuiz
  assignment?: ParsedAssignment
}

export interface ParsedCurriculum {
  lessons: ParsedLesson[]
  project?: ParsedProject
}

const WEEK_SPLIT =
  /\n(?:---\s*\n+|\s*(?=(?:#{1,6}\s+)?week\s*\d+\s*[:.)-]?\s))/i

const TITLE_LINE =
  /^(?:#{1,6}\s+)?(?:week\s*(\d+)\s*[:.)-]?\s*)(.+)$/i

const URL_RE = /https?:\/\/[^\s)>\]]+/gi
const VIDEO_HOST = /(?:youtube\.com|youtu\.be|vimeo\.com)/i

const DURATION_INLINE =
  /(?:duration|length|time)\s*[:.-]?\s*(\d{1,2}:\d{2}|\d+\s*(?:min|mins|minutes|hr|hours?))/i

const DURATION_VALUE = /^(\d{1,2}:\d{2}|\d+\s*(?:min|mins|minutes|hr|hours?))$/i

type BlockSection = "intro" | "topics" | "video" | "duration" | "materials" | "assignment" | "quiz"

function extractUrls(text: string): string[] {
  return [...new Set((text.match(URL_RE) || []).map((u) => u.replace(/[.,;]+$/, "")))]
}

function bulletText(line: string): string {
  return line.replace(/^[-•*]\s+/, "").replace(/^\d+[\).]\s+/, "").trim()
}

function isTopicBullet(line: string): boolean {
  return /^[-•*]\s+/.test(line)
}

function isNumberedLine(line: string): boolean {
  return /^\d+[\).]\s+/.test(line)
}

function normalizeSectionHeading(line: string): BlockSection | null {
  const stripped = line
    .replace(/^#{1,6}\s+/, "")
    .trim()
    .toLowerCase()
    .replace(/:+$/, "")

  if (/^topics?$/.test(stripped)) return "topics"
  if (/^videos?$/.test(stripped)) return "video"
  if (/^duration$/.test(stripped)) return "duration"
  if (/^materials?|resources?|readings?|notes?$/.test(stripped)) return "materials"
  if (/^assignments?$/.test(stripped)) return "assignment"
  if (/^quiz(zes)?$/.test(stripped)) return "quiz"
  return null
}

function isWeekBlock(block: string): boolean {
  const first = block.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || ""
  return TITLE_LINE.test(first) || /^week\s*\d+/i.test(first)
}

function isProjectBlock(block: string): boolean {
  const first = block.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || ""
  return /final\s+(?:capstone\s+)?project/i.test(first)
}

function mapAssignment(raw: unknown): ParsedAssignment | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const title = String(row.title || "").trim()
  const description = String(row.description || row.content || row.tasks || "").trim()
  if (!title && !description) return null
  return {
    title: title || "Assignment",
    description,
    format: row.format ? String(row.format).trim() : undefined,
  }
}

function mapQuiz(raw: unknown): ParsedQuiz | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const title = String(row.title || "").trim()
  const description = String(row.description || row.questions || "").trim()
  if (!title && !description) return null
  const numRaw = row.numQuestions ?? row.num_questions
  return {
    title: title || "Quiz",
    numQuestions: numRaw != null ? Number(numRaw) : undefined,
    description: description || undefined,
  }
}

function mapProject(raw: unknown): ParsedProject | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const title = String(row.title || "").trim()
  if (!title) return null
  return {
    title,
    description: row.description ? String(row.description).trim() : undefined,
    instructions: row.instructions ? String(row.instructions).trim() : undefined,
    format: row.format ? String(row.format).trim() : undefined,
  }
}

function normalizeLesson(raw: unknown, index: number): ParsedLesson | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const title = String(row.title || row.topic || row.name || "").trim()
  if (!title) return null

  const topics = Array.isArray(row.topics)
    ? row.topics.map((t) => String(t).trim()).filter(Boolean)
    : typeof row.topics === "string"
      ? row.topics.split(/\n|,/).map((t) => t.trim()).filter(Boolean)
      : []

  const materialsRaw = Array.isArray(row.materials) ? row.materials : []
  const materials: ParsedMaterial[] = materialsRaw
    .map((m) => {
      if (!m || typeof m !== "object") return null
      const mat = m as Record<string, unknown>
      const matTitle = String(mat.title || "").trim()
      if (!matTitle) return null
      const content = typeof mat.content === "string" ? mat.content.trim() : undefined
      const url = typeof mat.url === "string" ? mat.url.trim() : undefined
      const type =
        mat.type === "link" || (url && !content) ? ("link" as const) : ("document" as const)
      return { title: matTitle, content, url, type }
    })
    .filter((m): m is ParsedMaterial => m !== null)

  const weekRaw = row.week ?? row.order ?? row.position
  const week = weekRaw != null ? Number(weekRaw) : index + 1

  return {
    title,
    week: Number.isFinite(week) ? week : index + 1,
    duration: String(row.duration || row.video_duration || "").trim() || undefined,
    videoTitle: String(row.videoTitle || row.video_title || "").trim() || undefined,
    videoUrl: String(row.videoUrl || row.video_url || "").trim() || undefined,
    topics,
    materials: materials.length ? materials : undefined,
    quiz: mapQuiz(row.quiz) || undefined,
    assignment: mapAssignment(row.assignment) || undefined,
  }
}

export function normalizeParsedCurriculum(raw: unknown): ParsedCurriculum {
  if (!raw || typeof raw !== "object") return { lessons: [] }
  const root = raw as Record<string, unknown>
  const list = Array.isArray(root.lessons)
    ? root.lessons
    : Array.isArray(root.topics)
      ? root.topics
      : Array.isArray(root.curriculum)
        ? root.curriculum
        : []

  const lessons = list
    .map((item, i) => normalizeLesson(item, i))
    .filter((l): l is ParsedLesson => l !== null)

  const project = mapProject(root.project) || undefined

  return { lessons, project }
}

function parseDurationFromLines(lines: string[]): string | undefined {
  for (const line of lines) {
    const inline = line.match(DURATION_INLINE)
    if (inline) return inline[1].trim()
    if (DURATION_VALUE.test(line.trim())) return line.trim()
  }
  return undefined
}

function parseAssignmentFromLines(
  lines: string[],
  week: number,
): ParsedAssignment | null {
  const tasks = lines
    .map((l) => (isTopicBullet(l) ? bulletText(l) : isNumberedLine(l) ? null : l))
    .filter((l): l is string => Boolean(l?.trim()))
  if (tasks.length === 0) return null
  return {
    title: `Week ${week} Assignment`,
    description: tasks.map((t) => `• ${t}`).join("\n"),
    format: "Submit a GitHub repo or live demo URL with your completed work.",
  }
}

function parseQuizFromLines(lines: string[], week: number): ParsedQuiz | null {
  const questions = lines.filter((l) => isNumberedLine(l)).map(bulletText)
  if (questions.length === 0) return null
  return {
    title: `Week ${week} Quiz`,
    numQuestions: questions.length,
    description: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
  }
}

function extractFinalProjectFromText(fullText: string): ParsedProject | null {
  const capstone = fullText.match(
    /(?:^|\n)(#{1,6}\s*Final\s+(?:Capstone\s+)?Project[^\n]*)\n([\s\S]*)$/i,
  )
  if (capstone) {
    const body = capstone[2].trim()
    const titleMatch = body.match(/#{1,6}\s*Project\s+Title\s*\n+([^\n#]+)/i)
    const projectTitle = titleMatch?.[1]?.trim() || "Final Capstone Project"

    const deliverables = body.match(
      /#{1,6}\s*Deliverables\s*\n([\s\S]*?)(?=\n#{1,6}\s|\n*$)/i,
    )?.[1]

    return {
      title: projectTitle,
      description:
        body.match(/#{1,6}\s*Requirements\s*\n([\s\S]*?)(?=\n#{1,6}\s)/i)?.[1]?.trim().split("\n")[0] ||
        "Production-ready capstone applying everything from the course.",
      instructions: body,
      format: deliverables
        ? `Deliverables: ${deliverables.replace(/\n+/g, " ").trim().slice(0, 200)}…`
        : "Submit GitHub repo, live URL, documentation, and presentation video.",
    }
  }

  const legacy = fullText.match(
    /final\s+project\s*:\s*([\s\S]*?)(?=\n\s*(?:final\s+assessment|certificate\s+requirement|$))/i,
  )
  if (!legacy) return null

  return {
    title: "Final Capstone Project",
    description: "Apply everything you learned in a production-ready build.",
    instructions: legacy[1].trim(),
    format: "Submit GitHub repo + live demo URLs and a project summary.",
  }
}

function parseLessonBlock(block: string, index: number): ParsedLesson {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const firstLine = lines[0] || `Topic ${index + 1}`
  const titleMatch = firstLine.match(TITLE_LINE)
  const week = titleMatch?.[1] ? Number(titleMatch[1]) : index + 1
  const title = (titleMatch?.[2] || firstLine.replace(/^#+\s*/, "")).trim()

  let section: BlockSection = "intro"
  const topicLines: string[] = []
  const videoLines: string[] = []
  const durationLines: string[] = []
  const materialLines: string[] = []
  const assignmentLines: string[] = []
  const quizLines: string[] = []

  for (const line of lines.slice(1)) {
    const sectionKey = normalizeSectionHeading(line)
    if (sectionKey) {
      section = sectionKey
      continue
    }

    if (/^#{1,6}\s+/.test(line) && !sectionKey) {
      continue
    }

    switch (section) {
      case "topics":
        if (isTopicBullet(line)) topicLines.push(bulletText(line))
        break
      case "video":
        videoLines.push(line)
        break
      case "duration":
        durationLines.push(line)
        break
      case "materials":
        if (!/^assignments?$|^quiz/i.test(line)) materialLines.push(line)
        break
      case "assignment":
        assignmentLines.push(line)
        break
      case "quiz":
        quizLines.push(line)
        break
      case "intro":
        if (isTopicBullet(line)) topicLines.push(bulletText(line))
        break
    }
  }

  const videoBlock = videoLines.join("\n")
  const urls = extractUrls(videoBlock || block)
  const videoUrl = urls.find((u) => VIDEO_HOST.test(u))
  const duration =
    parseDurationFromLines(durationLines) ||
    parseDurationFromLines(lines) ||
    block.match(DURATION_INLINE)?.[1]?.trim()

  const materials: ParsedMaterial[] = []
  if (materialLines.length > 0) {
    materials.push({
      title: `${title} — reading notes`,
      content: materialLines.join("\n\n"),
      type: "document",
    })
  }

  return {
    title,
    week: Number.isFinite(week) ? week : index + 1,
    duration,
    videoUrl,
    videoTitle: videoUrl ? title : undefined,
    topics: topicLines,
    materials: materials.length ? materials : undefined,
    assignment: parseAssignmentFromLines(assignmentLines, week) || undefined,
    quiz: parseQuizFromLines(quizLines, week) || undefined,
  }
}

/** Rule-based parser when OpenAI is unavailable. */
export function parseCurriculumFallback(rawText: string): ParsedCurriculum {
  const text = rawText.trim()
  if (!text) return { lessons: [] }

  const project = extractFinalProjectFromText(text) || undefined
  const withoutProject = text.replace(
    /(?:^|\n)#{1,6}\s*Final\s+(?:Capstone\s+)?Project[\s\S]*$/i,
    "",
  )

  const chunks = withoutProject.split(WEEK_SPLIT).map((c) => c.trim()).filter(Boolean)
  const lessonChunks = chunks.filter((c) => isWeekBlock(c) && !isProjectBlock(c))

  const lessons =
    lessonChunks.length === 0
      ? isWeekBlock(text)
        ? [parseLessonBlock(text, 0)]
        : []
      : lessonChunks.map((chunk, i) => parseLessonBlock(chunk, i))

  return { lessons, project }
}

export function parseCurriculumJsonFromAi(text: string): ParsedCurriculum | null {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] || trimmed).trim()
  try {
    return normalizeParsedCurriculum(JSON.parse(candidate))
  } catch {
    return null
  }
}

/** Fill missing fields from rule-based parse; append extra weeks AI skipped. */
export function mergeCurriculum(
  primary: ParsedCurriculum,
  supplement: ParsedCurriculum,
): ParsedCurriculum {
  const byWeek = new Map(supplement.lessons.map((l) => [l.week ?? 0, l]))
  const seenWeeks = new Set<number>()

  const lessons = primary.lessons.map((lesson, i) => {
    const wk = lesson.week ?? i + 1
    seenWeeks.add(wk)
    const fb = byWeek.get(wk)
    if (!fb) return lesson
    return {
      ...lesson,
      assignment: lesson.assignment || fb.assignment,
      quiz: lesson.quiz || fb.quiz,
      materials: lesson.materials?.length ? lesson.materials : fb.materials,
      videoUrl: lesson.videoUrl || fb.videoUrl,
      duration: lesson.duration || fb.duration,
      topics: lesson.topics.length ? lesson.topics : fb.topics,
    }
  })

  for (const fb of supplement.lessons) {
    const wk = fb.week ?? 0
    if (!seenWeeks.has(wk)) {
      lessons.push(fb)
      seenWeeks.add(wk)
    }
  }

  lessons.sort((a, b) => (a.week ?? 0) - (b.week ?? 0))

  return {
    lessons,
    project: primary.project || supplement.project,
  }
}
