"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, Users, Star, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useFilter } from "@/contexts/filter-context"
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
  const { addToCart } = useCart()
  const {
    selectedCategories,
    selectedLevels,
    selectedPriceRanges,
    selectedEarningsRanges,
  } = useFilter()

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

  // Filter courses based on selected filters
  useEffect(() => {
    let filtered = courses

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category.toLowerCase().replace(/\s+/g, '-'))
      )
    }

    if (selectedLevels.length > 0) {
      filtered = filtered.filter((course) =>
        selectedLevels.includes(course.level.toLowerCase())
      )
    }

    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter((course) =>
        selectedPriceRanges.some((range) => matchesRange(course.price, range))
      )
    }

    if (selectedEarningsRanges.length > 0) {
      filtered = filtered.filter((course) =>
        selectedEarningsRanges.some((range) =>
          matchesRange(course.earningsPotential, range)
        )
      )
    }

    setFilteredCourses(filtered)
  }, [courses, selectedCategories, selectedLevels, selectedPriceRanges, selectedEarningsRanges])

  const handleAddToCart = (course: JsonCourse) => {
    addToCart({
      id: course.id,
      title: course.title,
      price: course.price,
      image: course.image,
      instructor: course.instructor,
    })
  }

  if (loading) {
    return <div className="text-center py-12">Loading courses...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <p className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCourses.length}</span> courses
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
          {filteredCourses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            return (
              <div key={course.id} className="group">
                <div className="glass-card rounded-3xl overflow-hidden h-full flex flex-col border border-white/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-5/3 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <Badge variant="secondary" className="absolute top-4 right-4">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
                      {course.category}
                    </span>
                    <h3 className="font-semibold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.instructor}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-3xl bg-primary/5 p-3 text-sm text-primary">
                        💰 Earn up to ₦{course.earningsPotential.toLocaleString()}
                      </div>
                      <div className="rounded-3xl bg-background/80 p-3 text-sm text-muted-foreground">
                        ⭐ {course.rating} • {course.students.toLocaleString()} students
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-4">
                      <span className="text-2xl font-bold">₦{course.price.toLocaleString()}</span>
                      {isEnrolled ? (
                        <Link href={`/dashboard/my-courses?courseId=${encodeURIComponent(course.id)}`}>
                          <Button className="whitespace-nowrap">Continue</Button>
                        </Link>
                      ) : (
                        <Button 
                          className="whitespace-nowrap"
                          onClick={() => handleAddToCart(course)}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredCourses.map((course) => {
            const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
            return (
              <div key={course.id} className="group">
                <div className="glass-card rounded-3xl overflow-hidden flex flex-col sm:flex-row border border-white/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-video sm:aspect-square sm:w-64 shrink-0 overflow-hidden bg-muted">
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
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-3xl bg-primary/5 p-3 text-sm text-primary">
                        💰 Earn up to ₦{course.earningsPotential.toLocaleString()}
                      </div>
                      <div className="rounded-3xl bg-background/80 p-3 text-sm text-muted-foreground">
                        ⭐ {course.rating} • {course.students.toLocaleString()} students
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-auto">
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
                        <Link href={`/dashboard/my-courses?courseId=${encodeURIComponent(course.id)}`}>
                          <Button className="rounded-full">Continue</Button>
                        </Link>
                      ) : (
                        <Button 
                          className="rounded-full"
                          onClick={() => handleAddToCart(course)}
                        >
                          Add to Cart
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
