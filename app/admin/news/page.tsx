import { AdminNews } from "@/components/admin/admin-news"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default function AdminNewsPage() {
  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="News"
        description="Publish platform updates and announcements for the home page."
      />
      <AdminNews />
    </div>
  )
}
