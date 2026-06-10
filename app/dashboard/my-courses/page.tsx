"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle2, 
  Filter,
  Search,
  MoreVertical,
  Star,
  Bookmark,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { CourseLearning } from "@/components/dashboard/course-learning"
import { AdminCourses } from "@/components/admin/admin-courses"
import { canTeachCourses } from "@/lib/admin"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, PenLine } from "lucide-react"
import { getCourseImageUrl } from "@/lib/course-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Course {
  id: string
  title: string
  description: string
  category: string
  image: string
  duration: string
  lessons: number
  instructor: string
  rating: number
  students: number
  level: string
  lastAccessed?: string
}

type FilterStatus = "all" | "in-progress" | "completed"
type CourseView = "purchased" | "created"

export default function MyCoursesPage() {
  const [courseView, setCourseView] = useState<CourseView>("purchased")
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Load catalog + enrollments in parallel
  useEffect(() => {
    const load = async () => {
      if (authLoading) return

      if (!user?.id) {
        setEnrolledCourses([])
        setCourses([])
        setLoading(false)
        return
      }

      try {
        const [coursesRes, enrollRes] = await Promise.all([
          fetch("/api/courses"),
          fetch(`/api/user-courses?userId=${encodeURIComponent(user.id)}`),
        ])
        const coursesData = await coursesRes.json()
        const enrollData = await enrollRes.json()

        if (!enrollRes.ok) {
          throw new Error(enrollData?.error || "Failed to fetch enrolled courses")
        }

        const catalog: Course[] = coursesData.courses || []
        setCourses(catalog)

        const enrolledIds = new Set(
          (enrollData.courseIds || []).map((id: string | number) => String(id)).filter(Boolean),
        )
        setEnrolledCourses(catalog.filter((course) => enrolledIds.has(course.id)))
      } catch (error) {
        console.error("Failed to load my courses:", error)
        toast({
          title: "Error",
          description: "Failed to load your courses",
          variant: "destructive",
        })
        setEnrolledCourses([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id, toast, authLoading])

  // Handle enrollment success message
  useEffect(() => {
    const enrolled = searchParams.get('enrolled')
    if (enrolled === 'true') {
      toast({
        title: "Enrollment Successful!",
        description: "Welcome to your new course. Start learning now!",
      })
      // Clean up URL
      router.replace('/dashboard/my-courses')
    }
  }, [searchParams, toast, router])

  useEffect(() => {
    const courseId = searchParams.get('courseId')
    if (courseId) {
      setSelectedCourseId(courseId)
    }
    const view = searchParams.get('view')
    if (view === 'created' || view === 'purchased') {
      setCourseView(view)
    }
  }, [searchParams])

  const isTeacher = canTeachCourses(user?.role)

  const switchView = (view: CourseView) => {
    setCourseView(view)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.replace(`/dashboard/my-courses?${params.toString()}`)
  }

  const verifyPayment = async (reference: string) => {
      try {
        const response = await fetch(`/api/verify-payment?reference=${reference}`, {
          credentials: "include",
        })
        const data = await response.json()

      if (data.success) {
        toast({
          title: "Payment Successful",
          description: "Course has been unlocked and added to your account!",
        })
        // Refetch enrolled courses via API (service role endpoint)
        const refreshRes = await fetch(`/api/user-courses?userId=${encodeURIComponent(user!.id)}`)
        const refreshData = await refreshRes.json()

        if (refreshRes.ok) {
          const refreshIds = (refreshData.courseIds || []).map((c: string | number) =>
            typeof c === 'string' ? c : String(c)
          ).filter(Boolean)

          const enrolled = courses.filter((course) => refreshIds.includes(course.id))
          setEnrolledCourses(enrolled)
        }
        // Clean up URL
        router.replace('/dashboard/my-courses')
      } else {
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Please contact support if you were charged.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({
        title: "Error",
        description: "Failed to verify payment. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setVerifyingPayment(false)
    }
  }

  // Function to get actual course status based on completion
  const getActualStatus = (courseId: string) => {
    if (user?.completedCourses?.includes(courseId)) {
      return "completed"
    }
    return "in-progress"
  }

  const filteredCourses = enrolledCourses.filter((course) => {
    const actualStatus = getActualStatus(course.id)
    const matchesFilter = filter === "all" || actualStatus === filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: enrolledCourses.length,
    inProgress: enrolledCourses.filter((c) => getActualStatus(c.id) === "in-progress").length,
    completed: enrolledCourses.filter((c) => getActualStatus(c.id) === "completed").length,
    notStarted: 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {selectedCourseId ? (
        <CourseLearning
          courseId={selectedCourseId.toString()}
          onBack={() => {
            setSelectedCourseId(null)
            const params = new URLSearchParams(searchParams.toString())
            params.delete("courseId")
            const qs = params.toString()
            router.replace(qs ? `/dashboard/my-courses?${qs}` : "/dashboard/my-courses")
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Verification Loading */}
          {verifyingPayment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <p className="text-blue-800">Verifying payment...</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground mt-1">
                {isTeacher && courseView === "created"
                  ? "Create, publish and manage the courses you teach"
                  : "Track your enrolled courses and continue learning"}
              </p>
            </div>

            {isTeacher && (
              <Tabs value={courseView} onValueChange={(v) => switchView(v as CourseView)}>
                <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
                  <TabsTrigger value="purchased" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Purchased
                  </TabsTrigger>
                  <TabsTrigger value="created" className="gap-2">
                    <PenLine className="h-4 w-4" />
                    Created
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {isTeacher && courseView === "created" ? (
            <AdminCourses tutorMode />
          ) : (
          <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.notStarted}</p>
                  <p className="text-sm text-muted-foreground">Not Started</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Grid — 4 per row on xl, equal card heights */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => {
              const actualStatus = getActualStatus(course.id)
              const progress =
                actualStatus === "completed" ? 100 : user?.courseProgress?.[course.id] || 0
              return (
              <div
                key={course.id}
                id={`course-${course.id}`}
                className="glass-card flex h-full flex-col overflow-hidden rounded-xl group"
              >
                <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
                  <img
                    src={getCourseImageUrl(course.image)}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                    <Badge
                      variant={actualStatus === "completed" ? "default" : "secondary"}
                      className={`h-5 px-1.5 text-[10px] ${actualStatus === "completed" ? "bg-green-500" : ""}`}
                    >
                      {actualStatus === "completed" ? "Done" : "Active"}
                    </Badge>
                    <div className="flex items-center gap-0.5 text-[11px] text-white">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <div className="mb-2 min-h-[3.25rem]">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {course.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Add to Favorites
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {course.instructor}
                    </p>
                  </div>

                  <div className="mb-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        {actualStatus === "completed" ? "Completed" : "Progress"}
                      </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="mb-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{course.duration || "Self-paced"}</span>
                  </div>

                  <Button
                    size="sm"
                    className="mt-auto h-8 w-full text-xs"
                    onClick={() => {
                      setSelectedCourseId(course.id)
                      const params = new URLSearchParams(searchParams.toString())
                      params.set("courseId", course.id)
                      router.replace(`/dashboard/my-courses?${params.toString()}`)
                    }}
                  >
                    {actualStatus === "completed" ? "Review" : "Continue"}
                  </Button>
                </div>
              </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="text-muted-foreground mt-1">
                {isTeacher
                  ? "Browse the catalog or switch to Created to publish your own courses."
                  : "Try adjusting your search or filter criteria"}
              </p>
              <Link href="/dashboard/browse-courses">
                <Button className="mt-4">Browse courses</Button>
              </Link>
            </div>
          )}
          </>
          )}
        </div>
      )}
    </>
  )
}

