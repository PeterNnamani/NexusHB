import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { AdminSubmissions } from "@/components/admin/admin-submissions"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function AdminSubmissionsPage() {
  return (
    <AdminPageGuard>
      <div className="w-full space-y-6">
        <AdminPageHeader
          title="Submissions"
          description="Review contact form messages and user suggestions."
        />
        <AdminSubmissions />
      </div>
    </AdminPageGuard>
  )
}
