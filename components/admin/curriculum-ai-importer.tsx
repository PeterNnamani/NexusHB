"use client"

import { useState } from "react"
import {
  Sparkles,
  Loader2,
  ClipboardPaste,
  ListOrdered,
  FileText,
  CheckCircle2,
  Video,
  FolderKanban,
  ClipboardList,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  mergeCurriculum,
  parseCurriculumFallback,
  type ParsedCurriculum,
} from "@/lib/parse-curriculum"

export type CurriculumImportPayload = {
  lessons: {
    id: string
    title: string
    week: number | null
    position: number
    video_url: string | null
    video_title: string | null
    duration: string | null
    topics: string[] | null
    quiz_title: string | null
    quiz_num_questions: number | null
    quiz_description: string | null
    assignment_title: string | null
    assignment_description: string | null
    assignment_format: string | null
  }[]
  materials: {
    id: string
    title: string
    url: string
    type: string
    lesson_id?: string | null
  }[]
  project: {
    project_title: string | null
    project_description: string | null
    project_instructions: string | null
    project_format: string | null
  } | null
  lessonsCreated: number
  materialsCreated: number
  assignmentsCreated: number
  quizzesCreated: number
  projectSaved: boolean
  replaced: boolean
  warnings?: string[]
}

type Props = {
  courseId: string
  courseTitle?: string
  existingTopicCount?: number
  compact?: boolean
  onImported: (result: CurriculumImportPayload) => void
}

export function CurriculumAiImporter({
  courseId,
  courseTitle,
  existingTopicCount = 0,
  compact = false,
  onImported,
}: Props) {
  const { toast } = useToast()
  const [rawText, setRawText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ParsedCurriculum | null>(null)
  const [source, setSource] = useState<"ai" | "fallback" | null>(null)
  const [showHelp, setShowHelp] = useState(!compact)

  const parseWithAi = async () => {
    if (!rawText.trim()) {
      toast({ title: "Paste your curriculum first", variant: "destructive" })
      return
    }

    const instant = parseCurriculumFallback(rawText)
    if (instant.lessons.length > 0) {
      setPreview(instant)
      setSource("fallback")
    }

    setParsing(true)
    try {
      const res = await fetch("/api/admin/parse-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rawText, courseTitle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Parse failed")

      const instant = parseCurriculumFallback(rawText)
      setPreview(mergeCurriculum(data.curriculum, instant))
      setSource(data.source)
      if (data.source === "ai") {
        toast({
          title: "AI refinement complete",
          description: `${data.lessonCount} topic(s) ready to import.`,
        })
      }
    } catch (err) {
      if (instant.lessons.length === 0) {
        toast({
          title: err instanceof Error ? err.message : "Parse failed",
          variant: "destructive",
        })
      }
    } finally {
      setParsing(false)
    }
  }

  const resolveCurriculum = async (): Promise<ParsedCurriculum | null> => {
    if (preview?.lessons.length) return preview
    if (!rawText.trim()) return null

    const instant = parseCurriculumFallback(rawText)
    if (instant.lessons.length > 0) {
      setPreview(instant)
      setSource("fallback")
      return instant
    }

    const res = await fetch("/api/admin/parse-curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rawText, courseTitle }),
    })
    const data = await res.json()
    if (!res.ok) return null
    const merged = mergeCurriculum(data.curriculum, parseCurriculumFallback(rawText))
    if (merged.lessons.length > 0) {
      setPreview(merged)
      setSource(data.source)
      return merged
    }
    return null
  }

  const importCurriculum = async () => {
    if (existingTopicCount > 0) {
      const confirmed = window.confirm(
        `Replace all ${existingTopicCount} saved topic(s) with this new curriculum? This cannot be undone.`,
      )
      if (!confirmed) return
    }

    setImporting(true)
    try {
      const curriculum = await resolveCurriculum()
      if (!curriculum?.lessons.length) {
        toast({
          title: "Nothing to save",
          description: "Paste your curriculum text first, then click Save to course.",
          variant: "destructive",
        })
        return
      }

      const res = await fetch("/api/admin/curriculum-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, curriculum, replace: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")

      onImported({
        lessons: data.lessons || [],
        materials: data.materials || [],
        project: data.project || null,
        lessonsCreated: data.lessonsCreated ?? 0,
        materialsCreated: data.materialsCreated ?? 0,
        assignmentsCreated: data.assignmentsCreated ?? 0,
        quizzesCreated: data.quizzesCreated ?? 0,
        projectSaved: !!data.projectSaved,
        replaced: data.replaced !== false,
      })

      const summary = `${data.lessonsCreated} topic(s), ${data.materialsCreated} material(s), ${data.assignmentsCreated ?? 0} assignment(s), ${data.quizzesCreated ?? 0} quiz(zes)${data.projectSaved ? ", final project" : ""}.`
      toast({
        title: "Curriculum saved",
        description: data.warnings?.length
          ? `${summary} Note: ${data.warnings[0]}`
          : summary,
      })
      setRawText("")
      setPreview(null)
      setSource(null)
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Import failed",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const totalMaterials =
    preview?.lessons.reduce((n, l) => n + (l.materials?.length ?? 0), 0) ?? 0
  const totalAssignments =
    preview?.lessons.filter((l) => l.assignment?.description || l.assignment?.title).length ?? 0
  const totalQuizzes =
    preview?.lessons.filter((l) => l.quiz?.description || l.quiz?.title).length ?? 0

  const wrapperClass = compact
    ? "space-y-3"
    : "rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4"

  return (
    <div className={wrapperClass}>
      {!compact && (
        <div>
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <ClipboardPaste className="h-4 w-4 text-primary" />
            Paste full curriculum — AI splits into topics & materials
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Paste your full syllabus — supports <code className="text-[10px]">## Week N</code> headers,
            <code className="text-[10px]">### Topics / Video / Duration / Materials / Assignment / Quiz</code>,
            numbered quiz questions, <code className="text-[10px]">---</code> separators, and a final capstone block.
            <strong className="font-medium text-foreground"> Save replaces the entire saved curriculum</strong> (not append).
          </p>
        </div>
      )}

      {compact && (
        <Collapsible open={showHelp} onOpenChange={setShowHelp}>
          <CollapsibleTrigger className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ClipboardPaste className="h-3 w-3" />
              Format guide — Week headers, Topics, Quiz, Project
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showHelp ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1.5 text-[11px] text-muted-foreground leading-relaxed">
            Use <code>## Week N</code>, <code>### Topics / Video / Materials / Assignment / Quiz</code>,
            <code> --- </code> between weeks, and <code># Final Capstone Project</code> at the end.
            <strong className="text-foreground"> Replace & save</strong> overwrites all existing topics.
          </CollapsibleContent>
        </Collapsible>
      )}

      <Textarea
        placeholder={`## Week 1: Advanced React Architecture\n\n### Topics\n* Enterprise Project Structure\n\n### Video\nhttps://youtube.com/...\n\n### Duration\n60 Minutes\n\n### Materials\nProfessional React applications...\n\n### Assignment\n* Create a scalable structure.\n\n### Quiz\n1. What is feature-based architecture?\n\n---\n\n# Final Capstone Project\n## Project Title\nEnterprise SaaS Dashboard`}
        rows={compact ? 6 : 10}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="font-mono text-xs bg-background resize-y min-h-[7rem]"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5 h-8 text-xs"
          onClick={parseWithAi}
          disabled={parsing || !rawText.trim()}
        >
          {parsing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {parsing ? "Refining…" : "Structure with AI"}
        </Button>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={importCurriculum}
          disabled={importing || !rawText.trim()}
        >
          {importing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {importing ? "Replacing…" : "Replace & save"}
        </Button>
        {existingTopicCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            Replaces {existingTopicCount} topic{existingTopicCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {preview && preview.lessons.length > 0 && (
        <Collapsible defaultOpen={!compact}>
          <div className="rounded-lg border bg-muted/20 overflow-hidden">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-medium">Preview</p>
                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                  {preview.lessons.length} topics
                </Badge>
                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                  {totalMaterials} materials
                </Badge>
                {totalAssignments > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">
                    {totalAssignments} assign
                  </Badge>
                )}
                {totalQuizzes > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">
                    {totalQuizzes} quiz
                  </Badge>
                )}
                {preview.project && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1 gap-0.5">
                    <FolderKanban className="h-2.5 w-2.5" />
                    Project
                  </Badge>
                )}
                {source && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">
                    {source === "ai" ? "AI" : "Auto"}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 max-h-48 overflow-y-auto px-3 pb-3 pt-0 border-t divide-y divide-border/50">
                {preview.lessons.map((lesson, i) => (
                  <div key={i} className="py-2 text-xs space-y-1.5 first:pt-2">
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">
                        {lesson.week ?? i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug line-clamp-2">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          {lesson.duration && <span>{lesson.duration}</span>}
                          {lesson.videoUrl && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              <Video className="h-2.5 w-2.5" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {lesson.topics.length > 0 && (
                      <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-7">
                        {lesson.topics.slice(0, 3).map((t, j) => (
                          <li key={j} className="flex items-start gap-1 line-clamp-1">
                            <ListOrdered className="h-2.5 w-2.5 shrink-0 mt-0.5 opacity-50" />
                            <span>{t}</span>
                          </li>
                        ))}
                        {lesson.topics.length > 3 && (
                          <li className="text-muted-foreground/70">+{lesson.topics.length - 3} more</li>
                        )}
                      </ul>
                    )}

                    {(lesson.materials?.length ?? 0) > 0 && (
                      <div className="pl-7 flex flex-wrap gap-1">
                        {lesson.materials!.slice(0, 2).map((m, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] text-muted-foreground"
                          >
                            <FileText className="h-2.5 w-2.5" />
                            {m.title}
                          </span>
                        ))}
                        {(lesson.materials?.length ?? 0) > 2 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{(lesson.materials?.length ?? 0) - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {lesson.assignment && (
                      <p className="pl-7 text-[10px] flex items-center gap-1 text-muted-foreground">
                        <ClipboardList className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{lesson.assignment.title}</span>
                      </p>
                    )}

                    {lesson.quiz && (
                      <p className="pl-7 text-[10px] flex items-center gap-1 text-muted-foreground">
                        <HelpCircle className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{lesson.quiz.title}</span>
                      </p>
                    )}
                  </div>
                ))}

                {preview.project && (
                  <div className="py-2 text-xs">
                    <p className="font-medium flex items-center gap-1 text-primary">
                      <FolderKanban className="h-3 w-3" />
                      {preview.project.title}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  )
}
