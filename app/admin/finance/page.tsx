import { AdminFinance } from "@/components/admin/admin-finance"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminFinancePage() {
  return (
    <AdminPageGuard>
      <AdminFinance />
    </AdminPageGuard>
  )
}
