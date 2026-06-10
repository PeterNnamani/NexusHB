"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SiteNavLink } from "@/components/site/site-nav-link"
import { ArrowRight, BookOpen, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { getCourseImageUrl } from "@/lib/course-image"

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
  instructor: string
  lessons: number
}

export function CoursesPreview() {
  const [courses, setCourses] = useState<PreviewCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 12_000)

    const loadCourses = async () => {
      try {
        const response = await fetch("/api/courses", { cache: "no-store" })
        const data = await response.json()
        if (cancelled) return
        const courseList: PreviewCourse[] = (data.courses || []).map((course: PreviewCourse) => ({
          ...course,
          id: String(course.id),
          featured: course.featured ?? false,
          earningsPotential: course.earningsPotential ?? course.price,
          instructor: course.instructor ?? "Nexus Instructor",
          lessons: course.lessons ?? 0,
        }))
        setCourses(courseList)
      } catch (error) {
        console.error("Failed to load featured courses:", error)
      } finally {
        if (!cancelled) setLoading(false)
        clearTimeout(timer)
      }
    }

    loadCourses()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const featuredCourses = courses.filter((course) => course.featured)
  const displayCourses = featuredCourses.length > 0 ? featuredCourses.slice(0, 8) : courses.slice(0, 8)
  const isEmpty = !loading && displayCourses.length === 0

  return (
    <section className="py-14 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-primary">
              Popular courses
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Start your learning journey</h2>
          </div>
          <SiteNavLink href="/courses">
            <Button variant="outline" className="rounded-full border-primary/30 px-5 hover:bg-primary/5">
              View all courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </SiteNavLink>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="nexus-course-card h-36 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Frontend foundations", level: "Beginner", topics: "HTML, CSS, responsive layouts" },
              { title: "JavaScript essentials", level: "Intermediate", topics: "DOM, APIs, modern ES6+" },
              { title: "Full-stack projects", level: "Advanced", topics: "React, Node, real client work" },
            ].map((track) => (
              <div
                key={track.title}
                className="flex flex-col rounded-2xl border border-dashed border-primary/30 bg-card p-6"
              >
                <Badge variant="secondary" className="mb-3 w-fit text-[10px]">{track.level}</Badge>
                <h3 className="mb-1.5 text-base font-semibold">{track.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{track.topics}</p>
                <SiteNavLink href="/courses">
                  <Button variant="outline" size="sm" className="w-full rounded-full">Explore catalog</Button>
                </SiteNavLink>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {displayCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block h-full">
                <article className="nexus-course-card flex h-full flex-col rounded-2xl p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
                  <CategoryBadge category={course.category} className="mb-4 w-fit" />
                  <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-primary">
                    {course.title}
                  </h3>
                  <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                    {course.lessons > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.lessons} lessons
                      </span>
                    )}
                    {course.duration && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}
                        </span>
                      </>
                    )}
                    {course.students > 0 && (
                      <>
                        <span className="hidden sm:inline">·</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {course.students.toLocaleString()}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-semibold text-earn">
                      Earn ₦
                    </span>
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm font-bold text-earn">
                      {course.price > 0 ? `₦${course.price.toLocaleString()}` : "Free"}
                    </span>
                    <span className="text-xs font-semibold text-primary group-hover:underline">
                      View details
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
