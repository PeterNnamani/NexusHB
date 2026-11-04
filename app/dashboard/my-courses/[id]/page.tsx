import { redirect } from "next/navigation"

type MyCoursesPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function MyCourseDetailPage({ params }: MyCoursesPageProps) {
  const { id } = await params
  redirect(`/dashboard/browse-courses/${encodeURIComponent(id)}`)
}
