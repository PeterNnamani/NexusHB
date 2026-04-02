"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play, Clock, ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"

interface Course {
  id: string
  title: string
  instructor: string
  image: string
  duration: string
  lessons: number
  nextLesson?: string
}

interface DashboardCoursesProps {
  onCourseSelect?: (courseId: string) => void
}

export function DashboardCourses({ onCourseSelect }: DashboardCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const { user } = useAuth()

  // Load all courses from JSON once
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const response = await fetch('/courses.json')
        const data = await response.json()
        const mappedCourses = data.courses.map((course: any, index: number) => ({
          id: (index + 1).toString(),
          title: course.title,
          instructor: course.instructor,
          image: course.image,
          duration: course.duration,
          lessons: course.lessons || 24,
          nextLesson: course.syllabus[0]?.topic || "Continue",
        }))
        setAllCourses(mappedCourses)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load courses:', error)
        setLoading(false)
      }
    }

    loadAllCourses()
  }, [])

  // Filter courses: only show enrolled courses that are NOT completed
  useEffect(() => {
    if (loading || allCourses.length === 0) return

    // Only show courses that user is enrolled in AND not completed
    const enrolledAndInProgress = allCourses.filter(course => {
      const courseId = parseInt(course.id)
      const isEnrolled = user?.enrolledCourses?.includes(courseId)
      const isNotCompleted = !user?.completedCourses?.includes(courseId)
      return isEnrolled && isNotCompleted
    })

    console.log('Dashboard filtering. Enrolled in progress:', enrolledAndInProgress.length)
    setCourses(enrolledAndInProgress)
  }, [user, allCourses, loading])

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Continue Learning</h2>
        <Link href="/dashboard/my-courses">
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {user?.completedCourses && user.completedCourses.length > 0
                ? "You've completed all your enrolled courses! 🎉"
                : "No courses enrolled yet. Browse our catalog to get started!"}
            </p>
            <Link href="/courses">
              <Button variant="outline" className="rounded-full">
                Explore Courses
              </Button>
            </Link>
          </div>
        ) : (
          courses.map((course) => {
            const courseProgress = user?.courseProgress?.[parseInt(course.id)] || 0
            return (
              <div
                key={course.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* Course Image */}
                <div className="relative w-full sm:w-32 aspect-video sm:aspect-square rounded-lg overflow-hidden shrink-0">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => onCourseSelect?.(course.id)}
                    className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-5 w-5 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </button>
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {courseProgress}% progress
                      </span>
                      <span className="font-medium">{courseProgress}%</span>
                    </div>
                    <Progress value={courseProgress} className="h-2" />
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{course.duration}</span>
                  </div>
                </div>

                {/* Learn Button */}
                <div className="flex sm:flex-col items-center justify-end gap-2">
                  <Button 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => onCourseSelect?.(course.id)}
                  >
                    <Play className="h-4 w-4 mr-1" fill="currentColor" />
                    Learn
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}