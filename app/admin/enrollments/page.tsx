"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminEnrollmentsPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Enrollments"
        description="Student course enrollments and progress across the platform."
        apiPath="/api/admin/enrollments"
        columns={[
          { key: "student", label: "Student" },
          { key: "email", label: "Email" },
          { key: "course", label: "Course" },
          { key: "progress", label: "Progress", align: "right", render: (r) => `${r.progress}%` },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          { key: "enrolledAt", label: "Enrolled", render: (r) => r.enrolledAt ? new Date(String(r.enrolledAt)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
