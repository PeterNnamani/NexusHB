"use client"

import { useEffect, useState } from "react"
import { useAdminView } from "@/contexts/admin-view-context"
import type { AdminViewId } from "@/lib/masked-routing"
import {
  Users,
  BookOpen,
  Wallet,
  Inbox,
  TrendingUp,
  GraduationCap,
  CreditCard,
  Activity,
  UserPlus,
  ShoppingCart,
  Video,
  Award,
  Mail,
  BarChart3,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmtNaira } from "@/lib/finance"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { adminFetch } from "@/lib/admin-fetch"

type AnalyticsBundle = {
  summary: {
    totalUsers: number
    newRegistrations: number
    publishedCourses: number
    draftCourses: number
    grossCollected: number
    monthlyRevenue: number
    platformRevenue: number
    tutorCredits: number
    studentReserve: number
    activeEnrollments: number
    activeSubscriptions: number
    pendingOrders: number
    contactSubmissions: number
    suggestions: number
    liveSessions: number
    certificates: number
    newsletterSubscribers: number
  }
  revenueChart: { month: string; revenue: number }[]
  signupsChart: { month: string; signups: number }[]
  enrollmentsChart: { month: string; enrollments: number }[]
  splitChart: { month: string; gross: number; platform: number; tutor: number }[]
  roleChart: { role: string; count: number }[]
  paymentStatus: { status: string; count: number }[]
  orderStatus: { status: string; count: number }[]
  topCourses: { id: string; title: string; students: number; status: string; price: number }[]
}

type StatsTables = {
  recentPayments: { id: string; amount: number; payer: string; item: string; paidAt: string | null }[]
  recentUsers: { name: string; email: string; role: string; joinedAt: string }[]
  pendingOrdersList: { reference: string; amount: number; createdAt: string }[]
}

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-2)"]

function formatMonth(key: string) {
  const [y, m] = key.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-NG", { month: "short" })
}

export function AdminOverview() {
  const { navigate } = useAdminView()
  const [analytics, setAnalytics] = useState<AnalyticsBundle | null>(null)
  const [tables, setTables] = useState<StatsTables | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch<{ analytics: AnalyticsBundle; tables: StatsTables }>("/api/admin/overview")
      .then((data) => {
        setAnalytics(data.analytics)
        setTables(data.tables)
      })
      .catch(() => {
        setAnalytics(null)
        setTables(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const s = analytics?.summary

  return (
    <div className="space-y-8 w-full max-w-[1600px]">
      <AdminPageHeader
        title="Platform Overview"
        description="Full analytics, charts, and live operational tables for every area of Nexus."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("analytics")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
            <Button size="sm" onClick={() => navigate("finance")}>
              <Wallet className="h-4 w-4 mr-2" />
              Treasury
            </Button>
          </div>
        }
      />

      {/* KPI grid — 12 metrics */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(12)].map((_, i) => <div key={i} className="h-[110px] rounded-2xl border border-border bg-muted/20 animate-pulse" />)
          : (
            <>
              <AdminKpiCard label="Total Users" value={String(s?.totalUsers ?? 0)} sub={`+${s?.newRegistrations ?? 0} this week`} icon={Users} />
              <AdminKpiCard label="Gross Revenue" value={fmtNaira(s?.grossCollected ?? 0)} sub={`${fmtNaira(s?.monthlyRevenue ?? 0)} this month`} icon={TrendingUp} />
              <AdminKpiCard label="Platform Share" value={fmtNaira(s?.platformRevenue ?? 0)} sub="Fees + subscriptions" icon={Wallet} />
              <AdminKpiCard label="Tutor Credits" value={fmtNaira(s?.tutorCredits ?? 0)} sub="Instructor earnings" icon={CreditCard} />
              <AdminKpiCard label="Student Reserve" value={fmtNaira(s?.studentReserve ?? 0)} sub="Payout pool" icon={GraduationCap} />
              <AdminKpiCard label="Enrollments" value={String(s?.activeEnrollments ?? 0)} sub={`${s?.activeSubscriptions ?? 0} subscriptions`} icon={Activity} />
              <AdminKpiCard label="Courses" value={String(s?.publishedCourses ?? 0)} sub={`${s?.draftCourses ?? 0} drafts`} icon={BookOpen} />
              <AdminKpiCard label="Pending Orders" value={String(s?.pendingOrders ?? 0)} sub="Awaiting payment" icon={ShoppingCart} />
              <AdminKpiCard label="Live Sessions" value={String(s?.liveSessions ?? 0)} sub="All sessions" icon={Video} />
              <AdminKpiCard label="Certificates" value={String(s?.certificates ?? 0)} sub="Issued" icon={Award} />
              <AdminKpiCard label="Newsletter" value={String(s?.newsletterSubscribers ?? 0)} sub="Subscribers" icon={Mail} />
              <AdminKpiCard label="Submissions" value={String((s?.contactSubmissions ?? 0) + (s?.suggestions ?? 0))} sub="Contact + suggestions" icon={Inbox} />
            </>
          )}
      </div>

      {/* Charts — row 1 */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-5">
        <ChartCard title="Revenue" sub="6 months" loading={loading}>
          <ChartContainer config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }} className="h-[200px] w-full">
            <AreaChart data={analytics?.revenueChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={44} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Sign-ups" sub="6 months" loading={loading}>
          <ChartContainer config={{ signups: { label: "Sign-ups", color: "var(--chart-2)" } }} className="h-[200px] w-full">
            <BarChart data={analytics?.signupsChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} className="text-xs" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Enrollments" sub="6 months" loading={loading}>
          <ChartContainer config={{ enrollments: { label: "Enrollments", color: "var(--chart-3)" } }} className="h-[200px] w-full">
            <LineChart data={analytics?.enrollmentsChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} className="text-xs" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="enrollments" stroke="var(--color-enrollments)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Users by role" sub="Composition" loading={loading}>
          <ChartContainer config={{ count: { label: "Users", color: "var(--chart-1)" } }} className="h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={analytics?.roleChart ?? []} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={45} outerRadius={72} strokeWidth={2}>
                {(analytics?.roleChart ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
        </ChartCard>
      </div>

      {/* Revenue split full width */}
      <ChartCard title="Revenue split" sub="Gross · platform fee · tutor credits — 6 months" loading={loading} className="p-5">
        <ChartContainer
          config={{
            gross: { label: "Gross", color: "var(--chart-1)" },
            platform: { label: "Platform", color: "var(--chart-3)" },
            tutor: { label: "Tutor", color: "var(--chart-2)" },
          } satisfies ChartConfig}
          className="h-[240px] w-full"
        >
          <BarChart data={analytics?.splitChart ?? []}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={52} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="gross" fill="var(--color-gross)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="platform" fill="var(--color-platform)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="tutor" fill="var(--color-tutor)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      {/* Status charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <ChartCard title="Payment status" sub="All records" loading={loading}>
          <ChartContainer config={{ count: { label: "Count", color: "var(--chart-1)" } }} className="h-[180px] w-full">
            <BarChart data={analytics?.paymentStatus ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Order status" sub="Checkout pipeline" loading={loading}>
          <ChartContainer config={{ count: { label: "Count", color: "var(--chart-2)" } }} className="h-[180px] w-full">
            <BarChart data={analytics?.orderStatus ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid xl:grid-cols-2 gap-6">
        <DataTable title="Recent payments" linkView="payments" linkLabel="All payments"
          headers={["Payer", "Item", "Amount", "Date"]}
          loading={loading}
          rows={(tables?.recentPayments ?? []).map((p) => [
            p.payer, p.item, fmtNaira(p.amount),
            p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—",
          ])}
        />
        <DataTable title="Recent sign-ups" linkView="users" linkLabel="All users"
          headers={["Name", "Role", "Joined"]}
          loading={loading}
          rows={(tables?.recentUsers ?? []).map((u) => [
            u.name, u.role,
            u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "—",
          ])}
        />
        <DataTable title="Top courses" linkView="courses" linkLabel="Manage"
          headers={["Course", "Students", "Price"]}
          loading={loading}
          rows={(analytics?.topCourses ?? []).map((c) => [
            c.title, String(c.students), fmtNaira(c.price),
          ])}
        />
        <DataTable title="Pending orders" linkView="orders" linkLabel="All orders"
          headers={["Reference", "Amount", "Created"]}
          loading={loading}
          rows={(tables?.pendingOrdersList ?? []).map((o) => [
            `${o.reference.slice(0, 12)}…`, fmtNaira(o.amount),
            o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—",
          ])}
        />
      </div>

      {/* Quick links to every area */}
      <div>
        <h2 className="text-base font-semibold mb-4">All control areas</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(
            [
              { id: "analytics", label: "Analytics" },
              { id: "finance", label: "Treasury" },
              { id: "payments", label: "Payments" },
              { id: "orders", label: "Orders" },
              { id: "users", label: "Users" },
              { id: "enrollments", label: "Enrollments" },
              { id: "subscriptions", label: "Subscriptions" },
              { id: "courses", label: "Courses" },
              { id: "news", label: "News" },
              { id: "live-sessions", label: "Live Sessions" },
              { id: "certificates", label: "Certificates" },
              { id: "submissions", label: "Submissions" },
              { id: "newsletter", label: "Newsletter" },
              { id: "operations", label: "Operations" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className="text-left w-full"
            >
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Students</p>
            <p className="text-xl font-bold">{analytics?.roleChart?.find((r) => r.role === "Students")?.count ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Tutors</p>
            <p className="text-xl font-bold">{analytics?.roleChart?.find((r) => r.role === "Tutors")?.count ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <Inbox className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Submissions</p>
            <p className="text-xl font-bold">{(s?.contactSubmissions ?? 0) + (s?.suggestions ?? 0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  sub,
  loading,
  children,
  className = "rounded-2xl border border-border bg-card p-5",
}: {
  title: string
  sub: string
  loading: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground mb-3">{sub}</p>
      {loading ? <div className="h-[200px] bg-muted/20 animate-pulse rounded-xl" /> : children}
    </div>
  )
}

function DataTable({
  title,
  linkView,
  linkLabel,
  headers,
  rows,
  loading,
}: {
  title: string
  linkView: AdminViewId
  linkLabel: string
  headers: string[]
  rows: string[][]
  loading: boolean
}) {
  const { navigate } = useAdminView()
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate(linkView)}>
          {linkLabel}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              {headers.map((h) => (
                <th key={h} className="px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={headers.length} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-5 py-8 text-center text-muted-foreground">No data</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  {row.map((cell, j) => (
                    <td key={j} className="px-5 py-3">{j === 1 && title.includes("sign-ups") ? <Badge variant="secondary" className="capitalize text-xs">{cell}</Badge> : cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
