"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ChevronDown,
  Play,
  Clock,
  BookOpen,
  BarChart3,
  ArrowLeft,
  Download,
  FileText,
  ListChecks,
  Video,
  Layers,
  ClipboardCheck,
  FolderKanban,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CourseCompletionModal } from "./course-completion-modal"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toEmbedVideoUrl } from "@/lib/video-url"
import { getCourseImageUrl } from "@/lib/course-image"
import { CourseAssessmentPanel } from "@/components/dashboard/course-assessment-panel"
import { buildRefKey, type AssessmentKind, type SubmissionBody } from "@/lib/assessments"

interface Video {
  id: string
  title: string
  url: string
  duration: string
}

interface Material {
  id: string
  title: string
  url: string
  type: string
}

interface SyllabusWeek {
  lessonId: string
  week: number
  topic: string
  duration: string
  topics: string[]
  videos: Video[]
  materials: Material[]
  quiz: { title: string; numQuestions: number | null; description: string | null } | null
  assignment: { title: string; description: string | null; format: string | null } | null
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  instructor: string
  price: number
  image: string
  level: string
  duration: string
  rating: number
  students: number
  lessons: number
  syllabus: SyllabusWeek[]
  materials: Material[]
  project: {
    title: string
    description: string | null
    instructions: string | null
    format: string | null
  } | null
}

type SavedSubmission = {
  ref_key: string
  kind: AssessmentKind
  lesson_id: string | null
  body: SubmissionBody
  submitted_at: string
}

interface CourseLearningProps {
  courseId: string
  onBack: () => void
}

type TabType = "overview" | "materials" | "quiz" | "assignment" | "project"

export function CourseLearning({ courseId, onBack }: CourseLearningProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [courseCompletedData, setCourseCompletedData] = useState<{
    streak: number
    totalCompleted: number
  } | null>(null)
  const [submissions, setSubmissions] = useState<SavedSubmission[]>([])
  const { user, completeCourse, updateCourseProgress } = useAuth()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
          credentials: "include",
        })
        const data = await response.json()
        const foundCourse: Course | null = data.course || null

        if (foundCourse) {
          setCourse(foundCourse)
          const firstWeek = foundCourse.syllabus?.[0]
          if (firstWeek) {
            setSelectedWeek(firstWeek.week)
            setExpandedWeeks(new Set([firstWeek.week]))
            if (firstWeek.videos?.[0]) {
              setSelectedVideo(firstWeek.videos[0])
            }
          }
        }
      } catch (error) {
        console.error("Failed to load course:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId])

  useEffect(() => {
    if (!user?.id || !course) return
    const loadProgress = async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
      if (data) {
        setCompletedLessons(new Set(data.map((r: { lesson_id: string }) => r.lesson_id)))
      }
    }
    loadProgress()
  }, [user?.id, course])

  useEffect(() => {
    if (!user?.id || !course) return
    fetch(`/api/assessments?courseId=${encodeURIComponent(course.id)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .catch(() => setSubmissions([]))
  }, [user?.id, course])

  const getSubmission = (kind: AssessmentKind, lessonId?: string) => {
    if (!course) return null
    return (
      submissions.find((s) => s.ref_key === buildRefKey(kind, course.id, lessonId)) ?? null
    )
  }

  const currentWeekIndex = useMemo(() => {
    if (!course || selectedWeek == null) return -1
    return course.syllabus.findIndex((w) => w.week === selectedWeek)
  }, [course, selectedWeek])

  const isOnLastTopic = useMemo(() => {
    if (!course?.syllabus.length || currentWeekIndex < 0) return false
    return currentWeekIndex === course.syllabus.length - 1
  }, [course, currentWeekIndex])

  const projectUnlocked = isOnLastTopic

  const hasPublishedProject = !!course?.project?.title
  const projectSubmitted = !!getSubmission("project")
  const canFinishCourse =
    isOnLastTopic && (!hasPublishedProject || projectSubmitted)

  const nextWeek =
    course && currentWeekIndex >= 0 && currentWeekIndex < course.syllabus.length - 1
      ? course.syllabus[currentWeekIndex + 1]
      : null

  const totalLessons = useMemo(
    () => course?.syllabus.reduce((sum, w) => sum + w.videos.length, 0) ?? 0,
    [course],
  )

  const progressPercentage = useMemo(() => {
    if (!course || totalLessons === 0) return 0
    if (user?.completedCourses?.includes(course.id)) return 100
    return Math.round((completedLessons.size / totalLessons) * 100)
  }, [course, totalLessons, completedLessons.size, user?.completedCourses])

  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      if (!user?.id || !course) return
      if (completedLessons.has(lessonId)) return

      const next = new Set(completedLessons)
      next.add(lessonId)
      setCompletedLessons(next)

      const progress = totalLessons > 0 ? Math.round((next.size / totalLessons) * 100) : 0
      updateCourseProgress(course.id, progress)

      await supabase.from("lesson_progress").upsert(
        { user_id: user.id, lesson_id: lessonId, course_id: course.id },
        { onConflict: "user_id,lesson_id" },
      )
    },
    [user?.id, course, completedLessons, totalLessons, updateCourseProgress],
  )

  const toggleWeek = (week: number) => {
    const next = new Set(expandedWeeks)
    if (next.has(week)) next.delete(week)
    else next.add(week)
    setExpandedWeeks(next)
  }

  const handleWeekSelect = (week: SyllabusWeek) => {
    setSelectedWeek(week.week)
    if (week.lessonId) void markLessonComplete(week.lessonId)
    if (week.videos[0]) {
      setSelectedVideo(week.videos[0])
    } else {
      setSelectedVideo(null)
    }
  }

  const handleVideoSelect = (video: Video, week: number) => {
    setSelectedVideo(video)
    setSelectedWeek(week)
    void markLessonComplete(video.id)
  }

  const allVideos = useMemo(() => {
    if (!course) return []
    const items: { video: Video; week: number }[] = []
    course.syllabus.forEach((week) => {
      week.videos.forEach((video) => items.push({ video, week: week.week }))
    })
    return items
  }, [course])

  const getVideoNavigation = () => {
    if (!selectedVideo) return { previousVideo: null, nextVideo: null }
    const currentIndex = allVideos.findIndex((v) => v.video.id === selectedVideo.id)
    return {
      previousVideo: currentIndex > 0 ? allVideos[currentIndex - 1] : null,
      nextVideo: currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null,
    }
  }

  const { previousVideo, nextVideo } = getVideoNavigation()
  const currentWeek = course?.syllabus.find((w) => w.week === selectedWeek) ?? null

  const embedUrl = toEmbedVideoUrl(selectedVideo?.url)
  const displayTitle = selectedVideo?.title ?? currentWeek?.topic ?? course?.title ?? "Course lesson"

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your learning space…</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Course not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Courses
        </Button>
      </div>
    )
  }

  const tabs: {
    id: TabType
    label: string
    icon: React.ReactNode
    locked?: boolean
  }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="h-4 w-4" /> },
    { id: "materials", label: "Materials", icon: <Download className="h-4 w-4" /> },
    { id: "quiz", label: "Quiz", icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: "assignment", label: "Assignment", icon: <FileText className="h-4 w-4" /> },
    {
      id: "project",
      label: "Project",
      icon: projectUnlocked ? (
        <FolderKanban className="h-4 w-4" />
      ) : (
        <Lock className="h-4 w-4" />
      ),
      locked: !projectUnlocked,
    },
  ]

  const weekMaterials = [
    ...(currentWeek?.materials ?? []),
    ...course.materials.filter(
      (m) => !currentWeek?.materials.some((wm) => wm.id === m.id),
    ),
  ]

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-6 lg:flex-row">
      {/* Main learning panel — always visible */}
      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            My Courses
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{course.instructor}</p>
          </div>
          <Badge variant="outline">{course.level || "All levels"}</Badge>
        </div>

        {/* Video player area */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative aspect-video w-full min-h-[280px] bg-zinc-950 sm:min-h-[360px] lg:min-h-[420px]">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={displayTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                {getCourseImageUrl(course.image) ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${getCourseImageUrl(course.image)})` }}
                  />
                ) : null}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                    <Video className="h-10 w-10 text-white/70" />
                  </div>
                  <p className="max-w-md text-lg font-medium text-white">
                    {currentWeek
                      ? "This topic has no video yet — review the overview and materials below."
                      : "Pick a topic from the curriculum to begin."}
                  </p>
                  <p className="max-w-sm text-sm text-white/60">
                    Your instructor can add videos and resources at any time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson meta + progress */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{displayTitle}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {selectedVideo?.duration || currentWeek?.duration || course.duration || "Self-paced"}
              </Badge>
              {selectedWeek != null && (
                <Badge variant="secondary">
                  <Layers className="mr-1 h-3 w-3" />
                  Topic {selectedWeek}
                </Badge>
              )}
              <Badge variant="outline">
                <BarChart3 className="mr-1 h-3 w-3" />
                {course.level}
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedLessons.size}/{Math.max(totalLessons, course.syllabus.length)} lessons completed
              </span>
              <span className="font-semibold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex overflow-x-auto border-b border-border bg-muted/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.locked && (
                  <span className="text-[10px] text-amber-600">Locked</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">About this course</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {course.description || "No description provided yet."}
                  </p>
                </div>

                {currentWeek && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Topic {currentWeek.week}: {currentWeek.topic}
                    </h3>
                    {currentWeek.topics.length > 0 ? (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {currentWeek.topics.map((topic, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Learning objectives for this topic will appear here when your instructor adds them.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-3">
                {weekMaterials.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
                    <span className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-800 dark:text-sky-300">
                      <FileText className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <p className="text-sm text-muted-foreground">No materials for this topic yet.</p>
                  </div>
                ) : (
                  weekMaterials.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">{m.title}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))
                )}
              </div>
            )}

            {activeTab === "quiz" &&
              (currentWeek ? (
                <CourseAssessmentPanel
                  kind="quiz"
                  courseId={course.id}
                  lessonId={currentWeek.lessonId}
                  topicLabel={`Topic ${currentWeek.week}: ${currentWeek.topic}`}
                  quiz={currentWeek.quiz}
                  existing={getSubmission("quiz", currentWeek.lessonId)}
                  onSubmitted={(s) =>
                    setSubmissions((prev) => [
                      ...prev.filter((p) => p.ref_key !== s.ref_key),
                      s as SavedSubmission,
                    ])
                  }
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a topic from the curriculum to view its quiz.
                </p>
              ))}

            {activeTab === "assignment" &&
              (currentWeek ? (
                <CourseAssessmentPanel
                  kind="assignment"
                  courseId={course.id}
                  lessonId={currentWeek.lessonId}
                  topicLabel={`Topic ${currentWeek.week}: ${currentWeek.topic}`}
                  assignment={currentWeek.assignment}
                  existing={getSubmission("assignment", currentWeek.lessonId)}
                  onSubmitted={(s) =>
                    setSubmissions((prev) => [
                      ...prev.filter((p) => p.ref_key !== s.ref_key),
                      s as SavedSubmission,
                    ])
                  }
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a topic from the curriculum to view its assignment.
                </p>
              ))}

            {activeTab === "project" && (
              <CourseAssessmentPanel
                kind="project"
                courseId={course.id}
                project={course.project}
                locked={!projectUnlocked}
                lockReason="Open the final topic in the curriculum to unlock the project submission."
                existing={getSubmission("project")}
                onSubmitted={(s) =>
                  setSubmissions((prev) => [
                    ...prev.filter((p) => p.ref_key !== s.ref_key),
                    s as SavedSubmission,
                  ])
                }
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-3 pb-6">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() =>
              previousVideo && handleVideoSelect(previousVideo.video, previousVideo.week)
            }
            disabled={!previousVideo}
          >
            ← Previous
          </Button>
          {!isOnLastTopic ? (
            nextVideo ? (
              <Button
                className="ml-auto rounded-full"
                onClick={() => handleVideoSelect(nextVideo.video, nextVideo.week)}
              >
                Next lesson →
              </Button>
            ) : nextWeek ? (
              <Button
                className="ml-auto rounded-full"
                onClick={() => handleWeekSelect(nextWeek)}
              >
                Next topic →
              </Button>
            ) : null
          ) : (
            <Button
              className="ml-auto rounded-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!canFinishCourse}
              title={
                hasPublishedProject && !projectSubmitted
                  ? "Submit your final project to finish the course"
                  : undefined
              }
              onClick={async () => {
                if (!user || !course || !canFinishCourse) return
                updateCourseProgress(course.id, 100)
                await completeCourse(course.id)
                setCourseCompletedData({
                  streak: user.streak + 1,
                  totalCompleted: user.completedCourses.length + 1,
                })
                setShowCompletionModal(true)
              }}
            >
              Finish course
            </Button>
          )}
        </div>
      </div>

      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false)
          setCourseCompletedData(null)
          onBack()
        }}
        courseTitle={course.title}
        streak={courseCompletedData?.streak ?? user?.streak ?? 0}
        totalCompleted={
          courseCompletedData?.totalCompleted ?? user?.completedCourses.length ?? 0
        }
      />

      {/* Curriculum sidebar */}
      <div className="w-full shrink-0 lg:w-96">
        <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 hidden w-full justify-start lg:flex">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Courses
            </Button>
            <h3 className="truncate text-sm font-semibold">{course.title}</h3>
            <p className="text-xs text-muted-foreground">{course.syllabus.length} topics · {totalLessons} videos</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {course.syllabus.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Curriculum coming soon. Check back after your instructor publishes lessons.
              </div>
            ) : (
              <div className="space-y-2">
                {course.syllabus.map((week) => (
                  <div key={week.week} className="overflow-hidden rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => {
                        toggleWeek(week.week)
                        handleWeekSelect(week)
                      }}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50 ${
                        selectedWeek === week.week ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            selectedWeek === week.week
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {week.week}
                        </span>
                        <span className="truncate">{week.topic}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          expandedWeeks.has(week.week) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedWeeks.has(week.week) && (
                      <div className="border-t border-border bg-muted/20 py-1">
                        {week.topics.length > 0 && (
                          <ul className="border-b border-border/60 px-3 py-2 text-xs text-muted-foreground space-y-1">
                            {week.topics.slice(0, 4).map((t, i) => (
                              <li key={i} className="truncate">• {t}</li>
                            ))}
                          </ul>
                        )}
                        {week.videos.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No video yet</p>
                        ) : (
                          week.videos.map((video) => (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => handleVideoSelect(video, week.week)}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                                selectedVideo?.id === video.id
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
                              <span className="min-w-0 flex-1 truncate">{video.title}</span>
                              {completedLessons.has(video.id) && (
                                <span className="text-xs text-emerald-500">✓</span>
                              )}
                              <span className="shrink-0 text-xs opacity-70">{video.duration}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
