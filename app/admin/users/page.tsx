import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { AdminUsers } from "@/components/admin/admin-users"

export default function AdminUsersPage() {
  return (
    <AdminPageGuard>
      <AdminUsers />
    </AdminPageGuard>
  )
}
