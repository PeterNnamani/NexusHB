"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, Users, Star, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface JsonCourse {
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
}

export function CoursesGrid() {
  const [courses, setCourses] = useState<JsonCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const { user, enrollCourse } = useAuth()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/courses.json')
        const data = await response.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error('Failed to load courses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const handleEnroll = async (course: JsonCourse) => {
    if (!user) return

    // Enroll user
    await enrollCourse(course.id)
  }

  if (loading) {
    return <div className="text-center py-12">Loading courses...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <p className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{courses.length}</span> courses
        </p>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 glass-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            return (
              <div key={course.id} className="group">
                <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent" />
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
                      {course.category}
                    </span>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {course.instructor}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 mt-auto">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                      <span className="text-xl font-bold">₦{course.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    {isEnrolled ? (
                      <Link href={`/courses/${course.id}`}>
                        <Button className="w-full">Continue Learning</Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleEnroll(course)}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {courses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            return (
              <div key={course.id} className="group">
                <div className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                  <div className="relative aspect-video sm:aspect-square sm:w-64 shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary">{course.level}</Badge>
                      <span className="text-xs text-primary font-medium uppercase tracking-wider">
                        {course.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      By {course.instructor}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium text-foreground">{course.rating}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students.toLocaleString()} students
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-2xl font-bold">₦{course.price.toLocaleString()}</span>
                      {isEnrolled ? (
                        <Link href={`/courses/${course.id}`}>
                          <Button className="rounded-full">Continue Learning</Button>
                        </Link>
                      ) : (
                        <Button 
                          className="rounded-full"
                          onClick={() => handleEnroll(course)}
                        >
                          Enroll Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
