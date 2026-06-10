"use client"

import { useState } from "react"
import {
  ClipboardCheck,
  FileText,
  FolderKanban,
  Link2,
  Lock,
  Loader2,
  Send,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  SUBMISSION_LIMITS,
  type AssessmentKind,
  type LessonAssignment,
  type LessonQuiz,
  type CourseProject,
  type SubmissionBody,
} from "@/lib/assessments"

type SavedSubmission = {
  ref_key: string
  kind: AssessmentKind
  lesson_id: string | null
  body: SubmissionBody
  submitted_at: string
}

type Props = {
  kind: AssessmentKind
  courseId: string
  lessonId?: string
  topicLabel?: string
  quiz?: LessonQuiz | null
  assignment?: LessonAssignment | null
  project?: CourseProject | null
  locked?: boolean
  lockReason?: string
  existing?: SavedSubmission | null
  onSubmitted: (submission: SavedSubmission) => void
}

function submissionFormatHint(kind: AssessmentKind, custom?: string | null) {
  if (custom?.trim()) return custom.trim()
  if (kind === "quiz") {
    return "Number your answers (1, 2, 3…) or write short responses. Optional: add your self-score (e.g. 8/10)."
  }
  if (kind === "assignment") {
    return "Submit one link to your work — GitHub repo, CodePen, Google Drive, or deployed demo."
  }
  return "Submit up to 3 links (repo, live demo, docs) plus a short project summary."
}

export function CourseAssessmentPanel({
  kind,
  courseId,
  lessonId,
  topicLabel,
  quiz,
  assignment,
  project,
  locked = false,
  lockReason,
  existing,
  onSubmitted,
}: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [quizAnswers, setQuizAnswers] = useState(
    existing?.kind === "quiz" && "answers" in existing.body
      ? existing.body.answers
      : "",
  )
  const [quizScore, setQuizScore] = useState(
    existing?.kind === "quiz" && "selfScore" in existing.body
      ? existing.body.selfScore || ""
      : "",
  )
  const [assignmentUrl, setAssignmentUrl] = useState(
    existing?.kind === "assignment" && "url" in existing.body
      ? existing.body.url
      : "",
  )
  const [assignmentNotes, setAssignmentNotes] = useState(
    existing?.kind === "assignment" && "notes" in existing.body
      ? existing.body.notes || ""
      : "",
  )
  const [projectUrls, setProjectUrls] = useState<string[]>(
    existing?.kind === "project" && "urls" in existing.body
      ? [...existing.body.urls, "", ""].slice(0, 3)
      : ["", "", ""],
  )
  const [projectSummary, setProjectSummary] = useState(
    existing?.kind === "project" && "summary" in existing.body
      ? existing.body.summary
      : "",
  )

  const title =
    kind === "quiz"
      ? quiz?.title
      : kind === "assignment"
        ? assignment?.title
        : project?.title

  const description =
    kind === "quiz"
      ? quiz?.description
      : kind === "assignment"
        ? assignment?.description
        : project?.description

  const instructions = kind === "project" ? project?.instructions : null
  const formatHint = submissionFormatHint(
    kind,
    kind === "project"
      ? project?.format
      : kind === "assignment"
        ? assignment?.format
        : null,
  )

  const icon =
    kind === "quiz" ? (
      <ClipboardCheck className="h-8 w-8 text-primary" />
    ) : kind === "assignment" ? (
      <FileText className="h-8 w-8 text-primary" />
    ) : (
      <FolderKanban className="h-8 w-8 text-primary" />
    )

  if (!title && kind === "project" && locked) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-amber-600" />
        <h3 className="mt-3 font-semibold">Final project</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {lockReason ||
            "Open the final topic in the curriculum to unlock the final project."}
        </p>
      </div>
    )
  }

  if (!title) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
        {icon}
        {topicLabel && kind !== "project" && (
          <p className="text-sm font-medium">{topicLabel}</p>
        )}
        <p className="text-muted-foreground">
          {kind === "project"
            ? "Your instructor has not published the final project brief yet. Check back soon."
            : `Your instructor has not published a ${kind} for this topic yet. It will appear here when ready.`}
        </p>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-amber-600" />
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {lockReason ||
            "Complete every lesson in the curriculum to unlock the final project."}
        </p>
        {description && (
          <p className="mt-3 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    )
  }

  const handleSubmit = async () => {
    let payload: unknown
    if (kind === "quiz") {
      payload = { answers: quizAnswers, selfScore: quizScore || undefined }
    } else if (kind === "assignment") {
      payload = { url: assignmentUrl, notes: assignmentNotes || undefined }
    } else {
      payload = {
        urls: projectUrls.filter((u) => u.trim()),
        summary: projectSummary,
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          lessonId: lessonId || null,
          kind,
          payload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")

      toast({
        title: "Submitted",
        description:
          kind === "project"
            ? "Your final project was saved."
            : `Your ${kind} response was saved.`,
      })
      onSubmitted(data.submission)
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Submission failed",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const kindLabel =
    kind === "quiz" ? "Quiz" : kind === "assignment" ? "Assignment" : "Final project"

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {kindLabel}
            </Badge>
            {kind === "quiz" && quiz?.numQuestions != null && (
              <Badge variant="outline" className="text-[10px]">
                {quiz.numQuestions} questions
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {instructions && (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
          {instructions}
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {formatHint}
        </p>

        {kind === "quiz" && (
          <>
            <Textarea
              placeholder="1. Your answer to question one…&#10;2. …"
              rows={8}
              value={quizAnswers}
              onChange={(e) => setQuizAnswers(e.target.value)}
              maxLength={SUBMISSION_LIMITS.quizAnswers}
              className="font-mono text-sm"
            />
            <Input
              placeholder="Self-score (optional, e.g. 8/10)"
              value={quizScore}
              onChange={(e) => setQuizScore(e.target.value)}
              maxLength={20}
              className="max-w-xs"
            />
          </>
        )}

        {kind === "assignment" && (
          <>
            <Input
              placeholder="https://github.com/you/project"
              value={assignmentUrl}
              onChange={(e) => setAssignmentUrl(e.target.value)}
              type="url"
            />
            <Textarea
              placeholder="Short notes for your instructor (optional)"
              rows={3}
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              maxLength={SUBMISSION_LIMITS.assignmentNotes}
            />
          </>
        )}

        {kind === "project" && (
          <>
            {projectUrls.map((url, i) => (
              <Input
                key={i}
                placeholder={
                  i === 0
                    ? "GitHub / repo URL (required)"
                    : i === 1
                      ? "Live demo URL (optional)"
                      : "Docs or portfolio link (optional)"
                }
                value={url}
                onChange={(e) => {
                  const next = [...projectUrls]
                  next[i] = e.target.value
                  setProjectUrls(next)
                }}
                type="url"
              />
            ))}
            <Textarea
              placeholder="Project summary — what you built, tech stack, challenges solved…"
              rows={6}
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              maxLength={SUBMISSION_LIMITS.projectSummary}
            />
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="gap-2"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : existing ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {existing ? "Update submission" : "Submit"}
          </Button>
          {existing && (
            <p className="text-xs text-muted-foreground">
              Last saved {new Date(existing.submitted_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
