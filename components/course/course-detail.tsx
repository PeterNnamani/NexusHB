"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, ClipboardList, FileText, CheckCircle2, BookOpen, CreditCard, Star, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { PaymentModal } from "@/components/payment-modal"
import type { Course } from "@/lib/courses"

type CourseDetailProps = {
  course: Course
  backHref?: string
}

export function CourseDetail({ course, backHref = "/courses" }: CourseDetailProps) {
  const { user, enrollCourse } = useAuth()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const isEnrolled = user?.enrolledCourses?.includes(course.id.toString()) ?? false
  const completion = isEnrolled ? (course.status === "not-started" ? 0 : Math.min(100, Math.max(0, course.progress))) : 0

  const handlePurchase = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    // Payment modal handles enrollment
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-muted">
            <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
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
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Course Status</p>
                <Badge className="mt-1" variant={course.status === "completed" ? "default" : course.status === "in-progress" ? "secondary" : "outline"}>
                  {course.status === "completed" ? "Completed" : course.status === "in-progress" ? "In Progress" : "Not Started"}
                </Badge>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold">₦{course.price}</div>
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
              <div className="rounded-3xl bg-primary/5 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">What you can earn</p>
                <p className="text-2xl font-semibold mt-2">Up to ₦{course.earningsPotential.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Per task or project after completion</p>
              </div>
              <Button onClick={handlePurchase} className="w-full sm:w-auto" size="lg">
                <CreditCard className="mr-2 h-4 w-4" />
                Enroll Now - ₦{course.price}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {isEnrolled ? (
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
            <TabsTrigger value="assignments">
              <ClipboardList className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <FileText className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="grades">
              <CheckCircle2 className="h-4 w-4" />
              Grades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Course Overview</h2>
              <p className="text-sm text-muted-foreground">{course.description}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold">Syllabus</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {course.syllabus.map((module) => (
                  <div key={module.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{module.title}</p>
                        <p className="text-xs text-muted-foreground">{module.duration}</p>
                      </div>
                      <Badge variant={module.completed ? "default" : "outline"}>
                        {module.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Downloadable Materials</h2>
              <p className="text-sm text-muted-foreground">Grab the resources for this course and follow along at your own pace.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {course.materials.map((material) => (
                <div key={material.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{material.title}</p>
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {material.fileName} • {material.fileSize}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                      className="h-9"
                    >
                      <a href={material.url} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Assignments</h2>
              <p className="text-sm text-muted-foreground">Complete the assignments below and submit them before the due date.</p>
            </div>
            <div className="grid gap-4">
              {course.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due {assignment.dueDate}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        assignment.status === "graded"
                          ? "default"
                          : assignment.status === "submitted"
                          ? "secondary"
                          : "outline"
                      }>
                        {assignment.status === "graded"
                          ? "Graded"
                          : assignment.status === "submitted"
                          ? "Submitted"
                          : "Pending"}
                      </Badge>
                      <Button size="sm" variant="secondary">
                        {assignment.status === "graded" ? "View" : "Submit"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Quizzes</h2>
              <p className="text-sm text-muted-foreground">Test your knowledge with timed quizzes.</p>
            </div>
            <div className="grid gap-4">
              {course.quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.questions} questions • {quiz.timeLimit}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          quiz.status === "completed"
                            ? "default"
                            : quiz.status === "available"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {quiz.status === "completed"
                          ? "Completed"
                          : quiz.status === "available"
                          ? "Available"
                          : "Locked"}
                      </Badge>
                      <Button size="sm" disabled={quiz.status === "locked"}>
                        {quiz.status === "completed"
                          ? "Review"
                          : quiz.status === "available"
                          ? "Start"
                          : "Locked"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Grades</h2>
              <p className="text-sm text-muted-foreground">Track your score breakdown and progress details.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {course.grades.map((grade) => (
                <div key={grade.title} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{grade.title}</p>
                      <p className="text-sm text-muted-foreground">Weight: {grade.weight}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{grade.score}</p>
                      <p className="text-xs text-muted-foreground">/ {grade.maxScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Course Overview</h2>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">What You'll Learn</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {course.syllabus.slice(0, 4).map((module) => (
                <div key={module.id} className="rounded-2xl border border-border p-4">
                  <p className="font-medium">{module.title}</p>
                  <p className="text-xs text-muted-foreground">{module.duration}</p>
                </div>
              ))}
            </div>
            {course.syllabus.length > 4 && (
              <p className="text-sm text-muted-foreground">And {course.syllabus.length - 4} more modules...</p>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-border p-6 bg-background/80">
            <h3 className="text-base font-semibold">What You’ll Earn</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              After this course:
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">•</span>
                <span>Build real websites and client-ready projects.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">•</span>
                <span>Get freelance gigs that pay in Naira.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">•</span>
                <span>Earn up to ₦{course.earningsPotential.toLocaleString()} per task.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border p-6 bg-muted/50">
            <h3 className="text-lg font-semibold mb-2">Ready to Start Learning?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enroll now to get full access to all course materials, assignments, and quizzes.
            </p>
            <Button onClick={handlePurchase} size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              Enroll Now - ${course.price}
            </Button>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        course={{ id: course.id, title: course.title, price: course.price }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
