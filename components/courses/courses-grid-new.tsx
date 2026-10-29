"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Users, Star, Grid, List, ShoppingCart, Play, PenLine, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { canTeachCourses } from "@/lib/admin"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { getCourseImageUrl } from "@/lib/course-image"
import { useFilter } from "@/contexts/filter-context"
import { useDashboardPathOptional } from "@/contexts/dashboard-path-context"
import { CoursesFilter } from "@/components/courses/courses-filter"
import { CategoryBadge } from "@/components/category-badge"
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
  instructorId?: string
  status?: string
  price: number
  earningsPotential: number
  image: string
  level: string
  duration: string
  rating: number
  students: number
  lessons: number
}

function matchesRange(value: number, rangeId: string) {
  if (rangeId === '0-5000') return value <= 5000
  if (rangeId === '5001-8000') return value >= 5001 && value <= 8000
  if (rangeId === '8001+') return value >= 8001
  if (rangeId === '5001-10000') return value >= 5001 && value <= 10000
  if (rangeId === '10001+') return value >= 10001
  return true
}

export function CoursesGrid() {
  const [courses, setCourses] = useState<JsonCourse[]>([])
  const [filteredCourses, setFilteredCourses] = useState<JsonCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const { user } = useAuth()
  const router = useRouter()
  const dashboardPath = useDashboardPathOptional()
  const { toast } = useToast()
  const isTutor = canTeachCourses(user?.role)
  const { addToCart, isInCart, hydrated } = useCart()

  const isOwnCourse = (course: JsonCourse) =>
    isTutor && Boolean(user?.id && course.instructorId === user.id)
  const navigateDashboard = (path: string) => {
    if (dashboardPath) {
      dashboardPath.navigate(path)
      return
    }
    router.push(path)
  }
  const {
    searchQuery,
    selectedCategories,
    selectedLevels,
    selectedPriceRanges,
    selectedEarningsRanges,
  } = useFilter()

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 12_000)

    const loadCourses = async () => {
      try {
        const response = await fetch("/api/courses", { cache: "no-store", credentials: "include" })
        const data = await response.json()
        if (!cancelled) setCourses(data.courses || [])
      } catch (error) {
        console.error("Failed to load courses:", error)
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

  useEffect(() => {
    let filtered = courses

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(q) ||
          course.category.toLowerCase().includes(q) ||
          course.instructor.toLowerCase().includes(q) ||
          course.description?.toLowerCase().includes(q),
      )
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category.toLowerCase().replace(/\s+/g, "-")),
      )
    }

    if (selectedLevels.length > 0) {
      filtered = filtered.filter((course) =>
        selectedLevels.includes(course.level.toLowerCase()),
      )
    }

    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter((course) =>
        selectedPriceRanges.some((range) => matchesRange(course.price, range)),
      )
    }

    if (selectedEarningsRanges.length > 0) {
      filtered = filtered.filter((course) =>
        selectedEarningsRanges.some((range) =>
          matchesRange(course.earningsPotential, range),
        ),
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        default:
          return b.students - a.students
      }
    })

    setFilteredCourses(sorted)
  }, [
    courses,
    searchQuery,
    selectedCategories,
    selectedLevels,
    selectedPriceRanges,
    selectedEarningsRanges,
    sortBy,
  ])

  const handleAddToCart = (course: JsonCourse) => {
    const added = addToCart({
      id: course.id,
      title: course.title,
      price: course.price,
      image: getCourseImageUrl(course.image),
      instructor: course.instructor,
    })
    if (added) {
      toast({
        title: "Added to cart",
        description: `${course.title} — open Cart in the header to checkout.`,
      })
    } else {
      toast({ title: "Already in cart", description: course.title })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[16/10] animate-pulse bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex min-h-9 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-[6.5rem] text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCourses.length}</span>
          {filteredCourses.length === 1 ? " course" : " courses"}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <CoursesFilter />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40 shrink-0 rounded-full border-border/80 bg-background text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-full border border-border/80 p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 rounded-full"
            >
              <Grid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-7 w-7 rounded-full"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">No courses match your filters.</p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredCourses.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCourses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            const ownCourse = isOwnCourse(course)
            return (
              <div key={course.id} className="group min-w-0">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={getCourseImageUrl(course.image)}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      <CategoryBadge category={course.category} />
                      {ownCourse && (
                        <span className="rounded bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground">
                          Yours
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="truncate text-[10px] text-muted-foreground">{course.instructor}</p>
                    <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-snug transition-colors group-hover:text-primary sm:text-sm">
                      {course.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      {course.lessons > 0 && (
                        <span className="flex items-center gap-0.5">
                          <BookOpen className="h-3 w-3 text-primary/70" />
                          {course.lessons}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {course.students.toLocaleString()}
                      </span>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-muted-foreground/40 text-muted-foreground" />
                          {course.rating}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                      <span className="text-sm font-bold text-earn">
                        {course.price > 0 ? `₦${course.price.toLocaleString()}` : (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Free</span>
                        )}
                      </span>
                      {ownCourse ? (
                        <Button
                          size="sm"
                          className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[10px]"
                          onClick={() => navigateDashboard("/dashboard/my-courses?view=created")}
                        >
                          <PenLine className="h-3 w-3" />
                          Manage
                        </Button>
                      ) : isEnrolled ? (
                        <Button
                          size="sm"
                          className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[10px]"
                          onClick={() =>
                            navigateDashboard(
                              `/dashboard/my-courses?courseId=${encodeURIComponent(course.id)}`,
                            )
                          }
                        >
                          <Play className="h-3 w-3" />
                          Continue
                        </Button>
                      ) : hydrated && isInCart(course.id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[10px]"
                          onClick={() => navigateDashboard("/dashboard/cart")}
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Cart
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[10px] font-medium"
                          onClick={() => handleAddToCart(course)}
                        >
                          Start
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="space-y-3">
          {filteredCourses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            const ownCourse = isOwnCourse(course)
            return (
              <div key={course.id} className="group">
                <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:flex-row">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:h-28 sm:w-44">
                    <img
                      src={getCourseImageUrl(course.image)}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {ownCourse && (
                          <Badge className="h-5 bg-primary px-1.5 text-[10px] text-primary-foreground">Yours</Badge>
                        )}
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{course.level}</Badge>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{course.category}</span>
                      </div>
                      <h3 className="truncate text-sm font-semibold group-hover:text-primary sm:text-base">{course.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">{course.instructor}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-current opacity-70" />
                          {course.rating}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {course.students.toLocaleString()}
                        </span>
                        {course.duration && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {course.duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <span className="text-base font-bold">₦{course.price.toLocaleString()}</span>
                      {ownCourse ? (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => navigateDashboard("/dashboard/my-courses?view=created")}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          Manage
                        </Button>
                      ) : isEnrolled ? (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() =>
                            navigateDashboard(
                              `/dashboard/my-courses?courseId=${encodeURIComponent(course.id)}`,
                            )
                          }
                        >
                          <Play className="h-3.5 w-3.5" />
                          Continue
                        </Button>
                      ) : hydrated && isInCart(course.id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => navigateDashboard("/dashboard/cart")}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          In cart
                        </Button>
                      ) : (
                        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleAddToCart(course)}>
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Add to cart
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
