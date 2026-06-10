"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { fmtNaira } from "@/lib/finance"

export default function AdminPaymentsPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Payments"
        description="All payment transactions recorded on the platform."
        apiPath="/api/admin/payments"
        columns={[
          { key: "reference", label: "Reference", render: (r) => <span className="font-mono text-xs">{String(r.reference).slice(0, 14)}…</span> },
          { key: "payer", label: "Payer" },
          { key: "item", label: "Item" },
          { key: "amount", label: "Amount", align: "right", render: (r) => fmtNaira(Number(r.amount)) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          { key: "paidAt", label: "Paid", render: (r) => r.paidAt ? new Date(String(r.paidAt)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
