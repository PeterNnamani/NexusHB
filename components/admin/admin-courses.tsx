"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Sparkles,
  Video,
  FileText,
  ListOrdered,
  Pencil,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getCourseImageUrl } from "@/lib/course-image"
import { materialsForLessonAssessments } from "@/lib/assessment-materials"
import { decodeDocumentMaterialUrl, isDocumentMaterialUrl } from "@/lib/format-material"
import { CourseMaterialComposer } from "@/components/admin/course-material-composer"
import {
  CurriculumAiImporter,
  type CurriculumImportPayload,
} from "@/components/admin/curriculum-ai-importer"
import { adminFetch, invalidateAdminFetch } from "@/lib/admin-fetch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
      {children}
    </label>
  )
}

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  instructor: string | null
  price: number
  level: string | null
  duration: string | null
  image: string | null
  status: string
}

interface Lesson {
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
}

interface Material {
  id: string
  title: string
  url: string
  type: string
  lesson_id?: string | null
}

const emptyForm = {
  title: "",
  description: "",
  category: "",
  instructor: "",
  price: "",
  level: "Beginner",
  duration: "",
  image: "",
}

type CourseDetailsForm = typeof emptyForm

const LEVELS = ["Beginner", "Intermediate", "Advanced"]

function courseToDetailsForm(course: Partial<Course>): CourseDetailsForm {
  return {
    title: course.title || "",
    description: course.description || "",
    category: course.category || "",
    instructor: course.instructor || "",
    price: course.price != null ? String(course.price) : "",
    level: course.level || "Beginner",
    duration: course.duration || "",
    image: course.image || "",
  }
}

function CourseDetailsFields({
  form,
  onChange,
}: {
  form: CourseDetailsForm
  onChange: (next: CourseDetailsForm) => void
}) {
  const set = (key: keyof CourseDetailsForm, value: string) =>
    onChange({ ...form, [key]: value })

  return (
    <div className="grid sm:grid-cols-6 gap-3">
      <div className="sm:col-span-4">
        <FieldLabel>Title *</FieldLabel>
        <Input
          placeholder="Full-Stack Web Development"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Price (₦)</FieldLabel>
        <Input
          type="number"
          min={0}
          placeholder="15000"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Category</FieldLabel>
        <Input
          placeholder="Web Dev"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Instructor</FieldLabel>
        <Input
          placeholder="Your name"
          value={form.instructor}
          onChange={(e) => set("instructor", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-1">
        <FieldLabel>Level</FieldLabel>
        <select
          className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm"
          value={form.level}
          onChange={(e) => set("level", e.target.value)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-1">
        <FieldLabel>Duration</FieldLabel>
        <Input
          placeholder="12 wks"
          value={form.duration}
          onChange={(e) => set("duration", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-6">
        <FieldLabel>Cover image URL</FieldLabel>
        <Input
          placeholder="https://…"
          value={form.image}
          onChange={(e) => set("image", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-6">
        <FieldLabel>Description</FieldLabel>
        <Textarea
          placeholder="What will students learn?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="text-sm resize-y min-h-[4.5rem]"
        />
      </div>
    </div>
  )
}

export function AdminCourses({ tutorMode = false }: { tutorMode?: boolean }) {
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listScope, setListScope] = useState<"all" | "owned">("all")
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [publishingIds, setPublishingIds] = useState<Set<string>>(() => new Set())

  const loadCourses = useCallback(async (fresh = false) => {
    try {
      setLoadError(null)
      if (fresh) invalidateAdminFetch("/api/admin/courses")
      const data = await adminFetch<{ courses: Course[]; scope?: "all" | "owned" }>(
        "/api/admin/courses",
        { ttlMs: fresh ? 0 : undefined },
      )
      setCourses(data.courses || [])
      setListScope(data.scope === "owned" ? "owned" : "all")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load courses"
      setLoadError(message)
      setCourses([])
      toast({
        title: "Could not load courses",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (!loading && courses.length === 0) setShowCreateForm(true)
  }, [loading, courses.length])

  const createCourse = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          instructor: form.instructor,
          price: form.price,
          level: form.level,
          duration: form.duration,
          image: form.image || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Create failed")
      setForm(emptyForm)
      setShowCreateForm(false)
      if (data.course?.id) setExpanded(data.course.id)
      toast({ title: "Course created", description: "Expand below to paste curriculum or add materials." })
      loadCourses()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Create failed",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (course: Course) => {
    if (publishingIds.has(course.id)) return

    const previousStatus = course.status
    const newStatus = previousStatus === "published" ? "draft" : "published"

    setPublishingIds((prev) => new Set(prev).add(course.id))
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c)),
    )
    invalidateAdminFetch("/api/admin/courses")

    toast({
      title: newStatus === "published" ? "Course published" : "Moved to draft",
    })

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: course.id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")
      void loadCourses(true)
    } catch (err) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: previousStatus } : c)),
      )
      toast({
        title: err instanceof Error ? err.message : "Update failed",
        variant: "destructive",
      })
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev)
        next.delete(course.id)
        return next
      })
    }
  }

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Delete this course and all its lessons?")) return
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast({ title: "Course deleted" })
      loadCourses()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <Collapsible open={showCreateForm} onOpenChange={setShowCreateForm}>
        <Card className="rounded-xl border border-border/80 shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">New course</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Basics first — expand a course below to add curriculum & materials
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${showCreateForm ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 border-t bg-muted/10">
              <div className="pt-4">
                <CourseDetailsFields form={form} onChange={setForm} />
              </div>
              <div className="flex justify-end mt-3">
                <Button onClick={createCourse} disabled={creating} size="sm" className="gap-1.5 h-8">
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create course
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Your courses
            <Badge variant="secondary" className="font-normal text-xs">
              {courses.length}
            </Badge>
          </h2>
          {!showCreateForm && (
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-sm space-y-2">
            <p className="font-medium">No courses showing</p>
            {loadError ? (
              <p className="text-destructive">{loadError}</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Courses are stored in your Supabase <code className="text-xs">courses</code> table
                  when you click <strong>Create course</strong> and then <strong>Save to course</strong>
                  after pasting curriculum. Paste &amp; AI alone does not create a course row.
                </p>
                {tutorMode || listScope === "owned" ? (
                  <p className="text-muted-foreground">
                    You only see courses created under your tutor email. If your tutor email matches
                    the platform admin email, courses created in both accounts appear here.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Create your first course with the form above, or run{" "}
                    <code className="text-xs">course_assessments_migration.sql</code> in Supabase if
                    loads fail after recent updates.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          courses.map((course) => {
            const isExpanded = expanded === course.id
            const isPublishing = publishingIds.has(course.id)
            return (
            <Card key={course.id} className="rounded-xl overflow-hidden border-border/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                <div
                  className={`sm:w-28 shrink-0 bg-muted ${isExpanded ? "h-24 sm:min-h-[6rem]" : "h-24"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCourseImageUrl(course.image)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-3 sm:p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <Badge
                          variant={course.status === "published" ? "default" : "outline"}
                          className="text-[10px] h-5 capitalize"
                        >
                          {course.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {course.category || "Uncategorized"} · ₦{Number(course.price).toLocaleString()} ·{" "}
                        {course.level || "Beginner"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit course details"
                        onClick={() => {
                          setExpanded(course.id)
                          setEditingDetailsId(course.id)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 min-w-[5.5rem]"
                        disabled={isPublishing}
                        onClick={() => void togglePublish(course)}
                      >
                        {course.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingDetailsId(null)
                          setExpanded(isExpanded ? null : course.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <CourseContent
                      courseId={course.id}
                      courseTitle={course.title}
                      initialDetails={courseToDetailsForm(course)}
                      detailsEditing={editingDetailsId === course.id}
                      onDetailsEditingChange={(open) =>
                        setEditingDetailsId(open ? course.id : null)
                      }
                      onSaved={() => {
                        setExpanded(null)
                        setEditingDetailsId(null)
                        loadCourses(true)
                      }}
                      onCurriculumChanged={() => loadCourses(true)}
                    />
                  )}
                </CardContent>
              </div>
            </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

const emptyLessonForm = {
  title: "",
  week: "",
  video_url: "",
  video_title: "",
  duration: "",
  topics: "",
  quiz_title: "",
  quiz_num_questions: "",
  quiz_description: "",
  assignment_title: "",
  assignment_description: "",
  assignment_format: "",
}

const emptyProjectForm = {
  project_title: "",
  project_description: "",
  project_instructions: "",
  project_format: "",
}

function CourseContent({
  courseId,
  courseTitle,
  initialDetails,
  detailsEditing = false,
  onDetailsEditingChange,
  onSaved,
  onCurriculumChanged,
}: {
  courseId: string
  courseTitle?: string
  initialDetails?: CourseDetailsForm
  detailsEditing?: boolean
  onDetailsEditingChange?: (open: boolean) => void
  onSaved?: () => void
  onCurriculumChanged?: () => void
}) {
  const { toast } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [lessonForm, setLessonForm] = useState(emptyLessonForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyLessonForm)
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [detailsForm, setDetailsForm] = useState<CourseDetailsForm>(
    initialDetails || emptyForm,
  )
  const [savingDetails, setSavingDetails] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [contentLoading, setContentLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)
  const curriculumListRef = useRef<HTMLDivElement>(null)
  const detailsSectionRef = useRef<HTMLDivElement>(null)

  const scrollToCurriculum = useCallback(() => {
    requestAnimationFrame(() => {
      curriculumListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

  const load = useCallback(async (opts?: { silent?: boolean; scrollToList?: boolean }) => {
    const silent = opts?.silent && hasLoadedOnce.current
    if (silent) setRefreshing(true)
    else setContentLoading(true)
    setContentError(null)
    try {
      const [lessonRes, materialRes, courseRes] = await Promise.all([
        fetch(`/api/admin/lessons?courseId=${courseId}`, { credentials: "include", cache: "no-store" }),
        fetch(`/api/admin/materials?courseId=${courseId}`, { credentials: "include", cache: "no-store" }),
        fetch(`/api/admin/courses?id=${encodeURIComponent(courseId)}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ])
      const lessonData = await lessonRes.json()
      const materialData = await materialRes.json()
      const courseData = await courseRes.json()

      if (!lessonRes.ok) {
        throw new Error(lessonData.error || "Failed to load curriculum topics")
      }
      if (!materialRes.ok) {
        throw new Error(materialData.error || "Failed to load materials")
      }
      if (!courseRes.ok) {
        throw new Error(courseData.error || "Failed to load course details")
      }

      const loadedLessons: Lesson[] = lessonData.lessons || []
      setLessons(loadedLessons)
      setMaterials(materialData.materials || [])
      const row = courseData.course
      if (row) {
        setDetailsForm(courseToDetailsForm(row as Partial<Course>))
        setProjectForm({
          project_title: row.project_title || "",
          project_description: row.project_description || "",
          project_instructions: row.project_instructions || "",
          project_format: row.project_format || "",
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load course content"
      setContentError(message)
      toast({ title: message, variant: "destructive" })
    } finally {
      hasLoadedOnce.current = true
      setContentLoading(false)
      setRefreshing(false)
      if (opts?.scrollToList) scrollToCurriculum()
    }
  }, [courseId, toast, scrollToCurriculum])

  useEffect(() => {
    hasLoadedOnce.current = false
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when course changes
  }, [courseId])

  useEffect(() => {
    if (detailsEditing) {
      requestAnimationFrame(() => {
        detailsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [detailsEditing])

  const saveCourseDetails = async () => {
    if (!detailsForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }
    setSavingDetails(true)
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: courseId,
          title: detailsForm.title.trim(),
          description: detailsForm.description.trim() || null,
          category: detailsForm.category.trim() || null,
          instructor: detailsForm.instructor.trim() || null,
          price: Number(detailsForm.price) || 0,
          level: detailsForm.level,
          duration: detailsForm.duration.trim() || null,
          image: detailsForm.image.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save course details")
      onCurriculumChanged?.()
      onDetailsEditingChange?.(false)
      toast({ title: "Course details saved" })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save course details",
        variant: "destructive",
      })
    } finally {
      setSavingDetails(false)
    }
  }

  const handleImported = useCallback(
    (result: CurriculumImportPayload) => {
      setEditingId(null)
      setLessons(result.lessons)
      setMaterials(result.materials)
      if (result.project) {
        setProjectForm({
          project_title: result.project.project_title || "",
          project_description: result.project.project_description || "",
          project_instructions: result.project.project_instructions || "",
          project_format: result.project.project_format || "",
        })
      }
      hasLoadedOnce.current = true
      setContentLoading(false)
      setRefreshing(false)
      setContentError(null)
      scrollToCurriculum()
      onCurriculumChanged?.()
    },
    [onCurriculumChanged, scrollToCurriculum],
  )

  const materialsForLesson = (lessonId: string) =>
    materials.filter(
      (m) => m.lesson_id === lessonId && m.type !== "quiz" && m.type !== "assignment",
    )

  const assessmentsForLesson = (lessonId: string) =>
    materialsForLessonAssessments(materials, lessonId)

  const hasQuiz = (lesson: Lesson) =>
    !!lesson.quiz_title || !!assessmentsForLesson(lesson.id).quiz

  const hasAssignment = (lesson: Lesson) =>
    !!lesson.assignment_title || !!assessmentsForLesson(lesson.id).assignment

  const addLesson = async () => {
    if (!lessonForm.title.trim()) return
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, ...lessonForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add topic")
      setLessonForm(emptyLessonForm)
      onCurriculumChanged?.()
      await load({ silent: true, scrollToList: true })
      toast({ title: "Topic added", description: "Students will see it in the curriculum order." })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to add topic",
        variant: "destructive",
      })
    }
  }

  const lessonToForm = (lesson: Lesson) => ({
    title: lesson.title,
    week: lesson.week != null ? String(lesson.week) : "",
    video_url: lesson.video_url || "",
    video_title: lesson.video_title || "",
    duration: lesson.duration || "",
    topics: (lesson.topics || []).join("\n"),
    quiz_title: lesson.quiz_title || "",
    quiz_num_questions:
      lesson.quiz_num_questions != null ? String(lesson.quiz_num_questions) : "",
    quiz_description: lesson.quiz_description || "",
    assignment_title: lesson.assignment_title || "",
    assignment_description: lesson.assignment_description || "",
    assignment_format: lesson.assignment_format || "",
  })

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id)
    setEditForm(lessonToForm(lesson))
  }

  const saveProject = async () => {
    setSavingProject(true)
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: courseId, ...projectForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save project")
      onCurriculumChanged?.()
      toast({ title: "Final project saved" })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save project",
        variant: "destructive",
      })
    } finally {
      setSavingProject(false)
    }
  }

  const saveEdit = async () => {
    if (!editingId || !editForm.title.trim()) return
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId, courseId, ...editForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update topic")
      setEditingId(null)
      if (data.lesson) {
        setLessons((prev) =>
          prev.map((l) => (l.id === editingId ? { ...l, ...data.lesson } : l)),
        )
      }
      onCurriculumChanged?.()
      load({ silent: true })
      toast({ title: "Topic updated" })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update topic",
        variant: "destructive",
      })
    }
  }

  const moveLesson = async (id: string, direction: "up" | "down") => {
    await fetch("/api/admin/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, courseId, direction }),
    })
    onCurriculumChanged?.()
    load({ silent: true })
  }

  const deleteLesson = async (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id))
    await fetch(`/api/admin/lessons?id=${id}&courseId=${courseId}`, {
      method: "DELETE",
      credentials: "include",
    })
    onCurriculumChanged?.()
    load({ silent: true })
  }

  const deleteMaterial = async (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
    await fetch(`/api/admin/materials?id=${id}`, { method: "DELETE", credentials: "include" })
    load({ silent: true })
  }

  const displayMaterials = materials.filter(
    (m) => m.type !== "quiz" && m.type !== "assignment",
  )

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[11px] text-muted-foreground max-w-md">
          {contentLoading
            ? "Loading curriculum…"
            : refreshing
              ? "Syncing…"
              : lessons.length > 0
                ? `${lessons.length} topics · pencil to edit · Paste & import to replace`
                : "No curriculum yet — use Paste & import below"}
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 h-7 px-2 text-xs"
            disabled={contentLoading || refreshing}
            onClick={() => void load({ silent: true, scrollToList: true })}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {onSaved && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onSaved}>
              Done
            </Button>
          )}
        </div>
      </div>

      {contentError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive mb-3">
          {contentError}
        </p>
      )}

      <div ref={detailsSectionRef} className="mb-4 rounded-lg border bg-card/50 p-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h4 className="font-medium flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Course details
          </h4>
          {!detailsEditing && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={contentLoading}
              onClick={() => onDetailsEditingChange?.(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {contentLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : detailsEditing ? (
          <div className="space-y-3">
            <CourseDetailsFields form={detailsForm} onChange={setDetailsForm} />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                disabled={savingDetails}
                onClick={() => {
                  onDetailsEditingChange?.(false)
                  void load({ silent: true })
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                disabled={savingDetails}
                onClick={() => void saveCourseDetails()}
              >
                {savingDetails ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
                Save details
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Title</p>
              <p className="font-medium">{detailsForm.title || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Price</p>
              <p className="font-medium tabular-nums">
                ₦{Number(detailsForm.price || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Category</p>
              <p>{detailsForm.category || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Instructor</p>
              <p>{detailsForm.instructor || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Level</p>
              <p>{detailsForm.level || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration</p>
              <p>{detailsForm.duration || "—"}</p>
            </div>
            {detailsForm.description ? (
              <div className="sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">{detailsForm.description}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {contentLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid lg:grid-cols-5 gap-4">
        <div ref={curriculumListRef} className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <ListOrdered className="h-3.5 w-3.5" />
              Curriculum
              <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5">
                {lessons.length}
              </Badge>
            </h4>
            {refreshing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <div className="rounded-lg border bg-card/50 max-h-[min(24rem,50vh)] overflow-y-auto divide-y divide-border/60">
          {lessons.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground text-center">
              No topics yet. Import or add one in the editor →
            </p>
          )}
          {lessons.map((lesson, index) => (
            <div key={lesson.id} className="bg-card overflow-hidden">
              {editingId === lesson.id ? (
                <div className="space-y-2.5 p-2.5 bg-muted/20">
                  <div>
                    <FieldLabel>Title</FieldLabel>
                    <Input
                      placeholder="Topic title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Order</FieldLabel>
                      <Input
                        placeholder="#"
                        type="number"
                        value={editForm.week}
                        onChange={(e) => setEditForm({ ...editForm, week: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FieldLabel>Duration</FieldLabel>
                      <Input
                        placeholder="12:30"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FieldLabel>Video title</FieldLabel>
                      <Input
                        placeholder="Lesson name"
                        value={editForm.video_title}
                        onChange={(e) => setEditForm({ ...editForm, video_title: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <FieldLabel>Video URL</FieldLabel>
                      <Input
                        placeholder="https://…"
                        value={editForm.video_url}
                        onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Objectives</FieldLabel>
                    <Textarea
                      placeholder="One per line"
                      rows={2}
                      value={editForm.topics}
                      onChange={(e) => setEditForm({ ...editForm, topics: e.target.value })}
                      className="text-sm resize-y min-h-[3.5rem]"
                    />
                  </div>
                  <Accordion type="multiple" className="rounded-md border bg-background/80 px-2">
                    <AccordionItem value="quiz" className="border-b-0">
                      <AccordionTrigger className="py-2 text-xs hover:no-underline">
                        Quiz (optional)
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-0 space-y-2">
                        <Input
                          placeholder="Quiz title"
                          value={editForm.quiz_title}
                          onChange={(e) => setEditForm({ ...editForm, quiz_title: e.target.value })}
                          className="h-8 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="# questions"
                            type="number"
                            value={editForm.quiz_num_questions}
                            onChange={(e) =>
                              setEditForm({ ...editForm, quiz_num_questions: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Description"
                            value={editForm.quiz_description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, quiz_description: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="assignment">
                      <AccordionTrigger className="py-2 text-xs hover:no-underline">
                        Assignment (optional)
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-0 space-y-2">
                        <Input
                          placeholder="Assignment title"
                          value={editForm.assignment_title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, assignment_title: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="Submission format"
                          value={editForm.assignment_format}
                          onChange={(e) =>
                            setEditForm({ ...editForm, assignment_format: e.target.value })
                          }
                          className="h-8 text-sm"
                        />
                        <Textarea
                          placeholder="Instructions"
                          rows={2}
                          value={editForm.assignment_description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, assignment_description: e.target.value })
                          }
                          className="text-sm resize-y"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                    {lesson.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {lesson.week ? `${lesson.week}. ` : ""}
                        {lesson.title}
                      </p>
                      <div className="flex shrink-0 gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(lesson)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lesson.duration && (
                        <span className="text-[10px] text-muted-foreground">{lesson.duration}</span>
                      )}
                      {hasQuiz(lesson) && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">Quiz</Badge>
                      )}
                      {hasAssignment(lesson) && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">Assign</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === 0}
                      onClick={() => moveLesson(lesson.id, "up")}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={index === lessons.length - 1}
                      onClick={() => moveLesson(lesson.id, "down")}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <Accordion
            type="single"
            collapsible
            defaultValue="import"
            className="rounded-lg border bg-card px-3 shadow-sm"
          >
            <AccordionItem value="import" className="border-b-0">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Paste & import curriculum
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                <CurriculumAiImporter
                  courseId={courseId}
                  courseTitle={courseTitle}
                  existingTopicCount={lessons.length}
                  compact
                  onImported={handleImported}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="manual">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add single topic
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0 space-y-2.5">
                <Input
                  placeholder="Topic title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="h-9 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Order #"
                    type="number"
                    value={lessonForm.week}
                    onChange={(e) => setLessonForm({ ...lessonForm, week: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Duration"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Video title"
                    value={lessonForm.video_title}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_title: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Video URL"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <Textarea
                  placeholder="Objectives — one per line"
                  rows={3}
                  value={lessonForm.topics}
                  onChange={(e) => setLessonForm({ ...lessonForm, topics: e.target.value })}
                  className="text-sm resize-y"
                />
                <Button size="sm" className="gap-1.5 h-8" onClick={addLesson}>
                  <Video className="h-3.5 w-3.5" />
                  Append topic
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="project">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Final capstone project
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0 space-y-2">
                <Input
                  placeholder="Project title"
                  value={projectForm.project_title}
                  onChange={(e) => setProjectForm({ ...projectForm, project_title: e.target.value })}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Short description"
                  value={projectForm.project_description}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, project_description: e.target.value })
                  }
                  className="h-9 text-sm"
                />
                <Textarea
                  placeholder="Instructions (markdown OK)"
                  rows={3}
                  value={projectForm.project_instructions}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, project_instructions: e.target.value })
                  }
                  className="text-sm resize-y"
                />
                <Input
                  placeholder="Submission format"
                  value={projectForm.project_format}
                  onChange={(e) => setProjectForm({ ...projectForm, project_format: e.target.value })}
                  className="h-9 text-sm"
                />
                <Button size="sm" className="h-8" onClick={saveProject} disabled={savingProject}>
                  {savingProject ? "Saving…" : "Save project"}
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="materials">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Materials
                  <Badge variant="secondary" className="text-[10px] font-normal h-5">
                    {displayMaterials.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0 space-y-2">
                {displayMaterials.length > 0 && (
                  <div className="rounded-md border divide-y max-h-36 overflow-y-auto">
                    {displayMaterials.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-muted/40"
                      >
                        <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate flex-1 font-medium">{m.title}</span>
                        <Badge variant="outline" className="text-[9px] h-4 capitalize shrink-0">
                          {m.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive shrink-0"
                          onClick={() => deleteMaterial(m.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <CourseMaterialComposer
                  courseId={courseId}
                  compact
                  onSaved={() => load({ silent: true })}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      )}
    </div>
  )
}
