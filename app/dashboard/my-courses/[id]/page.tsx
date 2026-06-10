import { notFound } from "next/navigation"

import { getCourseWithContent } from "@/lib/courses-db"
import { CourseDetail } from "@/components/course/course-detail"

type MyCoursesPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function MyCourseDetailPage({ params }: MyCoursesPageProps) {
  const { id } = await params
  const course = await getCourseWithContent(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <CourseDetail course={course} backHref="/dashboard/my-courses" />
    </div>
  )
}
