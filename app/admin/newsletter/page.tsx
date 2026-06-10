"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminNewsletterPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Newsletter"
        description="Email subscribers to the Nexus newsletter."
        apiPath="/api/admin/newsletter"
        columns={[
          { key: "email", label: "Email" },
          { key: "subscribedAt", label: "Subscribed", render: (r) => r.subscribedAt ? new Date(String(r.subscribedAt)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
