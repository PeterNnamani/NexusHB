"use client"

import { useState } from "react"
import Link from "next/link"
import { continueCoursePath, useDashboardNavigate } from "@/hooks/use-dashboard-navigate"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  PlayCircle,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { getCourseImageUrl } from "@/lib/course-image"
import { PaymentModal } from "@/components/payment-modal"

export interface DetailVideo {
  id: string
  title: string
  url: string
  duration: string
}

export interface DetailMaterial {
  id: string
  title: string
  url: string
  type: string
}

export interface DetailWeek {
  week: number
  topic: string
  duration: string
  topics: string[]
  videos: DetailVideo[]
  materials: DetailMaterial[]
}

export interface DetailCourse {
  id: string
  title: string
  category: string
  level: string
  instructor: string
  description: string
  image: string
  duration: string
  students: number
  rating: number
  price: number
  earningsPotential: number
  syllabus: DetailWeek[]
  materials: DetailMaterial[]
  isVerified?: boolean
}

type CourseDetailProps = {
  course: DetailCourse
  backHref?: string
  onBackClick?: () => void
}

export function CourseDetail({
  course,
  backHref = "/courses",
  onBackClick,
}: CourseDetailProps) {
  const { user } = useAuth()
  const goDashboard = useDashboardNavigate()
  const { addToCart, isInCart } = useCart()
  const { toast } = useToast()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
  const isCompleted = user?.completedCourses?.includes(course.id) ?? false
  const inCart = isInCart(course.id)
  const completion = isEnrolled ? (isCompleted ? 100 : user?.courseProgress?.[course.id] ?? 0) : 0
  const imageUrl = getCourseImageUrl(course.image)

  const handleAddToCart = () => {
    const added = addToCart({
      id: course.id,
      title: course.title,
      price: course.price,
      image: imageUrl,
      instructor: course.instructor,
    })

    toast(
      added
        ? { title: "Added to cart", description: `${course.title} is ready for checkout.` }
        : { title: "Already in cart", description: course.title },
    )
  }

  return (
    <div className="-mx-5 -mt-6 space-y-5 lg:-mx-8 lg:-mt-8">
      <section className="relative h-48 overflow-hidden rounded-b-xl bg-muted sm:h-56 lg:h-64">
        {course.image && (
          <img src={imageUrl} alt={course.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        {onBackClick ? (
          <button
            type="button"
            onClick={onBackClick}
            aria-label="Back to courses"
            title="Back to courses"
            className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:left-6 sm:top-6"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href={backHref}
            aria-label="Back to courses"
            title="Back to courses"
            className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:left-6 sm:top-6"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-2.5 text-xl font-bold text-white drop-shadow sm:text-2xl">
            <span className="truncate">{course.instructor}</span>
            {course.isVerified && (
              <span
                title="Verified tutor"
                aria-label="Verified tutor"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 shadow-sm sm:h-8 sm:w-8"
              >
                <BadgeCheck className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {course.category && <Badge className="bg-white px-2 py-0.5 text-xs text-slate-900 hover:bg-white">{course.category}</Badge>}
            {course.level && <Badge variant="outline" className="border-white/70 bg-black/25 px-2 py-0.5 text-xs text-white">{course.level}</Badge>}
          </div>
        </div>
      </section>

      <div className="w-full space-y-4 px-4 sm:px-6 lg:px-8">
        <section className="space-y-3">
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{course.rating > 0 ? course.rating.toFixed(1) : "New"}</span>
              <span>course rating</span>
            </span>
            {course.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.duration}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {course.students.toLocaleString()} learners
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {course.syllabus.length} modules
            </span>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto rounded-full border border-border/70 bg-card p-1">
              <TabsTrigger value="overview" className="rounded-full px-4 py-1.5 text-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="materials" className="rounded-full px-4 py-1.5 text-sm">
                <Download className="h-3.5 w-3.5" />
                Materials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5">
              <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
                <h2 className="text-base font-semibold tracking-tight">What you&apos;ll learn</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {course.description || "Explore the course curriculum and learn practical skills with guided lessons."}
                </p>
                {course.earningsPotential > 0 && (
                  <div className="mt-4 rounded-xl bg-primary/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Career opportunity</p>
                    <p className="mt-1.5 text-lg font-bold">Earn up to ₦{course.earningsPotential.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Potential earnings per task or project after completion.</p>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-primary">Your learning path</p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight">Course curriculum</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.syllabus.length} module{course.syllabus.length === 1 ? "" : "s"} to guide your learning.
                  </p>
                </div>
                {course.syllabus.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    The course curriculum will be available soon.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {course.syllabus.map((week) => (
                      <article key={week.week} className="rounded-xl border border-border/70 bg-card px-3.5 py-3 sm:px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Module {week.week}</p>
                            <h3 className="mt-0.5 text-sm font-semibold">{week.topic}</h3>
                            {week.duration && <p className="mt-0.5 text-[11px] text-muted-foreground">{week.duration}</p>}
                          </div>
                          <Badge variant="outline" className="shrink-0 rounded-full px-2 py-0.5 text-[10px]">
                            {week.videos.length} lesson{week.videos.length === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        {week.topics.length > 0 && (
                          <details className="group mt-2 border-t border-border/60 pt-2">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                              <span>Topics ({week.topics.length})</span>
                              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                            </summary>
                            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              {week.topics.map((topic, index) => (
                                <li key={`${week.week}-${index}`} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                                  <Check className="mt-1 h-3 w-3 shrink-0 text-primary" />
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="materials" className="space-y-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Course materials</h2>
                <p className="mt-1 text-xs text-muted-foreground">Resources and downloads included with this course.</p>
              </div>
              {course.materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No materials have been added to this course yet.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {course.materials.map((material) => (
                    <a
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                    >
                      <span>
                        <span className="block text-sm font-medium">{material.title}</span>
                        <span className="mt-0.5 block text-[10px] uppercase text-muted-foreground">{material.type}</span>
                      </span>
                      <Download className="h-3.5 w-3.5 shrink-0 text-primary" />
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>

          <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg shadow-black/5">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">Course access</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight">
                {course.price > 0 ? `₦${course.price.toLocaleString()}` : "Free"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">Lifetime access. Learn at your own pace.</p>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {isEnrolled ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your progress</span>
                      <span className="font-semibold">{completion}%</span>
                    </div>
                    <Progress value={completion} className="h-1.5" />
                  </div>
                  <Button className="h-10 w-full text-sm" onClick={() => goDashboard(continueCoursePath(course.id))}>
                    <PlayCircle className="h-3.5 w-3.5" />
                    {isCompleted ? "Review course" : "Continue learning"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="h-10 w-full text-sm"
                    onClick={inCart ? () => goDashboard("/dashboard/cart") : handleAddToCart}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {inCart ? "View cart" : "Add to cart"}
                  </Button>
                  <Button className="h-10 w-full text-sm" onClick={() => setShowPaymentModal(true)}>
                    <CreditCard className="h-3.5 w-3.5" />
                    {course.price > 0 ? "Pay now" : "Enroll for free"}
                    <ArrowRight className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Separator />
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  {course.syllabus.length} learning modules
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {course.duration || "Self-paced learning"}
                </li>
                <li className="flex items-center gap-2.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Learn with {course.students.toLocaleString()} students
                </li>
                <li className="flex items-center gap-2.5">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  {course.materials.length} downloadable resources
                </li>
              </ul>
            </div>
          </div>
          </aside>
        </div>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={{
            id: course.id,
            title: course.title,
            price: course.price,
            description: course.description,
            duration: course.duration,
            instructor: course.instructor,
            rating: course.rating,
            category: course.category,
            level: course.level,
            students: course.students,
            image: imageUrl,
          }}
          onSuccess={() => {}}
        />
      </div>
    </div>
  )
}
