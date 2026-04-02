"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PreviewCourse {
  id: string
  title: string
  category: string
  level: string
  duration: string
  students: number
  rating: number
  price: number
  earningsPotential: number
  featured: boolean
  image: string
}

export function CoursesPreview() {
  const [courses, setCourses] = useState<PreviewCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch("/courses.json")
        const data = await response.json()
        const courseList: PreviewCourse[] = (data.courses || []).map((course: any) => ({
          ...course,
          id: String(course.id),
          featured: course.featured ?? false,
          earningsPotential: course.earningsPotential ?? course.price,
        }))
        setCourses(courseList)
      } catch (error) {
        console.error("Failed to load featured courses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const featuredCourses = courses.filter((course) => course.featured)
  const displayCourses = featuredCourses.length > 0 ? featuredCourses.slice(0, 6) : courses.slice(0, 6)

  if (loading) {
    return (
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading popular courses...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Popular Courses
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">
              Start Your Learning Journey
            </h2>
          </div>
          <Link href="/courses">
            <Button variant="outline" className="glass-button rounded-full group">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayCourses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col border border-white/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  {course.featured && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="secondary" className="absolute top-3 right-3">
                    {course.level}
                  </Badge>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
                    {course.category}
                  </span>
                  <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="grid gap-3 text-sm mb-4">
                    <div className="rounded-3xl bg-primary/5 p-3 text-primary">
                      💰 Earn up to ₦{course.earningsPotential.toLocaleString()}
                    </div>
                    <div className="rounded-3xl bg-background/80 p-3 text-muted-foreground">
                      ⭐ {course.rating} • {course.students.toLocaleString()} students
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xl font-bold text-foreground">₦{course.price.toLocaleString()}</span>
                    <div className="text-xs text-muted-foreground uppercase tracking-[0.18em] font-semibold">
                      {course.level}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
