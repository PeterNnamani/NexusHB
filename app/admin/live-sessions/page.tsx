"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminLiveSessionsPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Live Sessions"
        description="Scheduled and completed live classroom sessions."
        apiPath="/api/admin/live-sessions"
        columns={[
          { key: "title", label: "Session" },
          { key: "host", label: "Host" },
          { key: "course", label: "Course" },
          { key: "scheduledAt", label: "Scheduled", render: (r) => r.scheduledAt ? new Date(String(r.scheduledAt)).toLocaleString() : "—" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
        ]}
      />
    </AdminPageGuard>
  )
}
