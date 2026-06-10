import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminAnalyticsPage() {
  return (
    <AdminPageGuard>
      <AdminAnalytics />
    </AdminPageGuard>
  )
}
