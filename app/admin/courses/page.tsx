import { AdminCourses } from "@/components/admin/admin-courses"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function AdminCoursesPage() {
  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Courses"
        description="Create courses, add lessons and materials, and publish to the catalog."
      />
      <AdminCourses />
    </div>
  )
}
