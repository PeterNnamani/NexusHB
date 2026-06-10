"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { fmtNaira } from "@/lib/finance"

export default function AdminOrdersPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Orders"
        description="Checkout orders — pending, paid, failed, and cancelled."
        apiPath="/api/admin/orders"
        columns={[
          { key: "reference", label: "Reference", render: (r) => <span className="font-mono text-xs">{String(r.reference).slice(0, 14)}…</span> },
          { key: "buyer", label: "Buyer" },
          { key: "item", label: "Item" },
          { key: "amount", label: "Amount", align: "right", render: (r) => fmtNaira(Number(r.amount)) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          { key: "createdAt", label: "Created", render: (r) => r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
