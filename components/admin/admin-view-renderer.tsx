"use client"

import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { AdminFinance } from "@/components/admin/admin-finance"
import { AdminCourses } from "@/components/admin/admin-courses"
import { AdminNews } from "@/components/admin/admin-news"
import { AdminUsers } from "@/components/admin/admin-users"
import { AdminSubmissions } from "@/components/admin/admin-submissions"
import { AdminOperations } from "@/components/admin/admin-operations"
import { AdminPageGuard } from "@/components/admin/admin-page-guard"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminListPage, StatusBadge } from "@/components/admin/admin-list-page"
import { useAdminView } from "@/contexts/admin-view-context"
import { fmtNaira } from "@/lib/finance"
import type { AdminViewId } from "@/lib/masked-routing"

function CoursesView() {
  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Courses"
        description="Create courses, add lessons and materials, and publish to the catalog."
      />
      <AdminCourses />
    </div>
  )
}

function NewsView() {
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

function SubmissionsView() {
  return (
    <AdminPageGuard>
      <div className="w-full space-y-6">
        <AdminPageHeader
          title="Submissions"
          description="Review contact form messages and user suggestions."
        />
        <AdminSubmissions />
      </div>
    </AdminPageGuard>
  )
}

const VIEWS: Record<AdminViewId, React.ReactNode> = {
  overview: <AdminOverview />,
  analytics: (
    <AdminPageGuard>
      <AdminAnalytics />
    </AdminPageGuard>
  ),
  finance: (
    <AdminPageGuard>
      <AdminFinance />
    </AdminPageGuard>
  ),
  payments: (
    <AdminPageGuard>
      <AdminListPage
        title="Payments"
        description="All payment transactions recorded on the platform."
        apiPath="/api/admin/payments"
        columns={[
          {
            key: "reference",
            label: "Reference",
            render: (r) => (
              <span className="font-mono text-xs">{String(r.reference).slice(0, 14)}…</span>
            ),
          },
          { key: "payer", label: "Payer" },
          { key: "item", label: "Item" },
          {
            key: "amount",
            label: "Amount",
            align: "right",
            render: (r) => fmtNaira(Number(r.amount)),
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          {
            key: "paidAt",
            label: "Paid",
            render: (r) => (r.paidAt ? new Date(String(r.paidAt)).toLocaleDateString() : "—"),
          },
        ]}
      />
    </AdminPageGuard>
  ),
  orders: (
    <AdminPageGuard>
      <AdminListPage
        title="Orders"
        description="Checkout orders — pending, paid, failed, and cancelled."
        apiPath="/api/admin/orders"
        columns={[
          {
            key: "reference",
            label: "Reference",
            render: (r) => (
              <span className="font-mono text-xs">{String(r.reference).slice(0, 14)}…</span>
            ),
          },
          { key: "buyer", label: "Buyer" },
          { key: "item", label: "Item" },
          {
            key: "amount",
            label: "Amount",
            align: "right",
            render: (r) => fmtNaira(Number(r.amount)),
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          {
            key: "createdAt",
            label: "Created",
            render: (r) =>
              r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : "—",
          },
        ]}
      />
    </AdminPageGuard>
  ),
  users: (
    <AdminPageGuard>
      <AdminUsers />
    </AdminPageGuard>
  ),
  enrollments: (
    <AdminPageGuard>
      <AdminListPage
        title="Enrollments"
        description="Student course enrollments and progress across the platform."
        apiPath="/api/admin/enrollments"
        columns={[
          { key: "student", label: "Student" },
          { key: "email", label: "Email" },
          { key: "course", label: "Course" },
          {
            key: "progress",
            label: "Progress",
            align: "right",
            render: (r) => `${r.progress}%`,
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          {
            key: "enrolledAt",
            label: "Enrolled",
            render: (r) =>
              r.enrolledAt ? new Date(String(r.enrolledAt)).toLocaleDateString() : "—",
          },
        ]}
      />
    </AdminPageGuard>
  ),
  subscriptions: (
    <AdminPageGuard>
      <AdminListPage
        title="Subscriptions"
        description="Active and historical user subscription plans."
        apiPath="/api/admin/subscriptions"
        columns={[
          { key: "user", label: "User" },
          { key: "plan", label: "Plan" },
          {
            key: "price",
            label: "Price",
            align: "right",
            render: (r) => fmtNaira(Number(r.price)),
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
          {
            key: "periodEnd",
            label: "Renews",
            render: (r) =>
              r.periodEnd ? new Date(String(r.periodEnd)).toLocaleDateString() : "—",
          },
        ]}
      />
    </AdminPageGuard>
  ),
  courses: <CoursesView />,
  news: <NewsView />,
  "live-sessions": (
    <AdminPageGuard>
      <AdminListPage
        title="Live Sessions"
        description="Scheduled and completed live classroom sessions."
        apiPath="/api/admin/live-sessions"
        columns={[
          { key: "title", label: "Session" },
          { key: "host", label: "Host" },
          { key: "course", label: "Course" },
          {
            key: "scheduledAt",
            label: "Scheduled",
            render: (r) =>
              r.scheduledAt ? new Date(String(r.scheduledAt)).toLocaleString() : "—",
          },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={String(r.status)} /> },
        ]}
      />
    </AdminPageGuard>
  ),
  certificates: (
    <AdminPageGuard>
      <AdminListPage
        title="Certificates"
        description="Certificates issued to students upon course completion."
        apiPath="/api/admin/certificates"
        columns={[
          { key: "student", label: "Student" },
          { key: "course", label: "Course" },
          {
            key: "number",
            label: "Certificate #",
            render: (r) => <span className="font-mono text-xs">{String(r.number)}</span>,
          },
          {
            key: "issuedAt",
            label: "Issued",
            render: (r) =>
              r.issuedAt ? new Date(String(r.issuedAt)).toLocaleDateString() : "—",
          },
        ]}
      />
    </AdminPageGuard>
  ),
  submissions: <SubmissionsView />,
  newsletter: (
    <AdminPageGuard>
      <AdminListPage
        title="Newsletter"
        description="Email subscribers to the Nexus newsletter."
        apiPath="/api/admin/newsletter"
        columns={[
          { key: "email", label: "Email" },
          {
            key: "subscribedAt",
            label: "Subscribed",
            render: (r) =>
              r.subscribedAt ? new Date(String(r.subscribedAt)).toLocaleDateString() : "—",
          },
        ]}
      />
    </AdminPageGuard>
  ),
  operations: (
    <AdminPageGuard>
      <AdminOperations />
    </AdminPageGuard>
  ),
}

export function AdminViewRenderer() {
  const { view } = useAdminView()
  return <>{VIEWS[view] ?? VIEWS.overview}</>
}
