"use client"

import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { fmtNaira } from "@/lib/finance"

export default function AdminSubscriptionsPage() {
  return (
    <AdminPageGuard>
      <AdminListPage
        title="Subscriptions"
        description="Active and historical user subscription plans."
        apiPath="/api/admin/subscriptions"
        columns={[
          { key: "user", label: "User" },
          { key: "plan", label: "Plan" },
          { key: "price", label: "Price", align: "right", render: (r) => fmtNaira(Number(r.price)) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          { key: "periodEnd", label: "Renews", render: (r) => r.periodEnd ? new Date(String(r.periodEnd)).toLocaleDateString() : "—" },
        ]}
      />
    </AdminPageGuard>
  )
}
