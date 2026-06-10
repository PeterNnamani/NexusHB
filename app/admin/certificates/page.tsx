"use client"

import { AdminListPage } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"

export default function AdminCertificatesPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Certificates"
        description="Certificates issued to students upon course completion."
        apiPath="/api/admin/certificates"
        columns={[
          { key: "student", label: "Student" },
          { key: "course", label: "Course" },
          { key: "number", label: "Certificate #", render: (r) => <span className="font-mono text-xs">{String(r.number)}</span> },
          { key: "issuedAt", label: "Issued", render: (r) => r.issuedAt ? new Date(String(r.issuedAt)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
