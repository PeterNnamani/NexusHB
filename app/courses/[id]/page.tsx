import { redirect } from "next/navigation"

type CoursePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params
  redirect(`/dashboard/browse-courses/${encodeURIComponent(id)}`)
}
