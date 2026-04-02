import { notFound } from "next/navigation"

import { getCourseById } from "@/lib/courses"
import { CourseDetail } from "@/components/course/course-detail"

type CoursePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params
  const courseId = Number(id)
  const course = getCourseById(courseId)

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <CourseDetail course={course} backHref="/courses" />
      </div>
    </div>
  )
}
