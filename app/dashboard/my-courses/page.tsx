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
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
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

export default function MyCoursesPage() {
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

  // Load courses from courses.json
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/courses.json')
        const data = await response.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error('Failed to load courses:', error)
        setCourses([])
      }
    }
    loadCourses()
  }, [])

  // Fetch enrolled courses from Supabase
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user?.id || courses.length === 0) {
        setEnrolledCourses([])
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const res = await fetch(`/api/user-courses?userId=${encodeURIComponent(user.id)}`)
        const result = await res.json()

        if (!res.ok) {
          throw new Error(result?.error || 'Failed to fetch enrolled courses')
        }

        const enrolledCourseIds: string[] = []
        ;(result.courseIds || []).forEach((courseId: string | number) => {
          const id = typeof courseId === 'string' ? courseId : String(courseId)
          if (id) {
            enrolledCourseIds.push(id)
          }
        })

        const enrolled = courses.filter(course => enrolledCourseIds.includes(course.id))
        setEnrolledCourses(enrolled)
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error)
        toast({
          title: "Error",
          description: "Failed to load your courses",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchEnrolledCourses()
    }
  }, [user?.id, toast, authLoading, courses])

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
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
      try {
        const response = await fetch(`/api/verify-payment?reference=${reference}`)
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
    // Parse course ID to number for completedCourses check
    const numericId = parseInt(courseId.replace(/[^0-9]/g, ''), 10)
    if (user?.completedCourses?.includes(numericId)) {
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
          onBack={() => setSelectedCourseId(null)}
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Track your enrolled courses and continue learning
            </p>
          </div>

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
            <Select value={filter} onValueChange={setFilter}>
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

          {/* Courses Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => {
              const actualStatus = getActualStatus(course.id)
              return (
              <div key={course.id} id={`course-${course.id}`} className="glass-card rounded-2xl overflow-hidden group">
                {/* Course Image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <Badge 
                      variant={actualStatus === "completed" ? "default" : "secondary"}
                      className={actualStatus === "completed" ? "bg-green-500" : ""}
                    >
                      {actualStatus === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                    <div className="flex items-center gap-1 text-white text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
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
                    <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {actualStatus === "completed" ? "Course Completed" : `${user?.courseProgress?.[course.id] || 0}% completed`}
                      </span>
                      <span className="font-medium">{actualStatus === "completed" ? "100" : user?.courseProgress?.[course.id] || 0}%</span>
                    </div>
                    <Progress value={actualStatus === "completed" ? 100 : user?.courseProgress?.[course.id] || 0} className="h-2" />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                    <span>{course.lastAccessed}</span>
                  </div>

                  {/* Action */}
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    {actualStatus === "completed" ? "Review Course" : "Continue Learning"}
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
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

