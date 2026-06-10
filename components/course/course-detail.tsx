"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, BookOpen, CreditCard, Star, Clock, Users, PlayCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const isEnrolled = user?.enrolledCourses?.includes(course.id) ?? false
  const isCompleted = user?.completedCourses?.includes(course.id) ?? false
  const completion = isEnrolled ? (isCompleted ? 100 : user?.courseProgress?.[course.id] ?? 0) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {onBackClick ? (
            <button
              type="button"
              onClick={onBackClick}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          )}
          <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-muted">
            {course.image && <img src={course.image} alt={course.title} className="h-full w-full object-cover" />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">by {course.instructor}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isEnrolled ? (
            <>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
                <div className="flex items-center gap-3">
                  <Progress value={completion} className="h-2 w-32" />
                  <span className="text-sm font-medium">{completion}%</span>
                </div>
              </div>
              <Link href={`/dashboard/my-courses?courseId=${encodeURIComponent(course.id)}`}>
                <Button size="lg">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {isCompleted ? "Review Course" : "Continue Learning"}
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold">₦{course.price.toLocaleString()}</div>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {course.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.students.toLocaleString()}
                  </span>
                </div>
              </div>
              {course.earningsPotential > 0 && (
                <div className="rounded-3xl bg-primary/5 p-4 text-left">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">What you can earn</p>
                  <p className="text-2xl font-semibold mt-2">Up to ₦{course.earningsPotential.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Per task or project after completion</p>
                </div>
              )}
              <Button onClick={() => setShowPaymentModal(true)} className="w-full sm:w-auto" size="lg">
                <CreditCard className="mr-2 h-4 w-4" />
                Enroll Now - ₦{course.price.toLocaleString()}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Download className="h-4 w-4" />
            Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Course Overview</h2>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Syllabus ({course.syllabus.length} weeks)</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {course.syllabus.map((week) => (
                <div key={week.week} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Week {week.week}: {week.topic}</p>
                      {week.duration && <p className="text-xs text-muted-foreground">{week.duration}</p>}
                    </div>
                    <Badge variant="outline">{week.videos.length} video{week.videos.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  {week.topics.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {week.topics.slice(0, 4).map((t, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                      {week.topics.length > 4 && (
                        <li className="text-xs">+{week.topics.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Course Materials</h2>
            <p className="text-sm text-muted-foreground">Resources and downloads for this course.</p>
          </div>
          {course.materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No materials have been added to this course yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {course.materials.map((material) => (
                <a
                  key={material.id}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{material.title}</span>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        course={{ id: course.id, title: course.title, price: course.price }}
        onSuccess={() => {}}
      />
    </div>
  )
}
