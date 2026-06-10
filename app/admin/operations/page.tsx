import { AdminOperations } from "@/components/admin/admin-operations"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminOperationsPage() {
  return (
    <AdminPageGuard>
      <AdminOperations />
    </AdminPageGuard>
  )
}
