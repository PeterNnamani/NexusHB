"use client"

import { useEffect, useState } from "react"
import { useAdminView } from "@/contexts/admin-view-context"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { fmtNaira } from "@/lib/finance"
import { adminFetch } from "@/lib/admin-fetch"
import {
  Users,
  TrendingUp,
  Activity,
  Wallet,
  Video,
  Award,
  Mail,
  GraduationCap,
} from "lucide-react"

type AnalyticsData = {
  summary: Record<string, number>
  revenueChart: { month: string; revenue: number }[]
  signupsChart: { month: string; signups: number }[]
  enrollmentsChart: { month: string; enrollments: number }[]
  splitChart: { month: string; gross: number; platform: number; tutor: number }[]
  roleChart: { role: string; count: number }[]
  paymentStatus: { status: string; count: number }[]
  orderStatus: { status: string; count: number }[]
  courseStatus: { status: string; count: number }[]
  topCourses: { id: string; title: string; students: number; status: string; price: number }[]
}

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

function formatMonth(key: string) {
  const [y, m] = key.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-NG", { month: "short" })
}

export function AdminAnalytics() {
  const { navigate } = useAdminView()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch<AnalyticsData>("/api/admin/analytics")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const s = data?.summary

  const chart = (title: string, sub: string, children: React.ReactNode) => (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground mb-4">{sub}</p>
      {loading ? <div className="h-[220px] bg-muted/20 animate-pulse rounded-xl" /> : children}
    </div>
  )

  return (
    <div className="space-y-8 max-w-[1600px]">
      <AdminPageHeader
        title="Platform Analytics"
        description="Deep-dive metrics across users, revenue, enrollments, and content."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("overview")}>
            Back to Overview
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => <div key={i} className="h-[118px] rounded-2xl border border-border bg-muted/20 animate-pulse" />)
        ) : (
          <>
            <AdminKpiCard label="Total Users" value={String(s?.totalUsers ?? 0)} sub={`+${s?.newRegistrations ?? 0} this week`} icon={Users} />
            <AdminKpiCard label="Gross Revenue" value={fmtNaira(s?.grossCollected ?? 0)} sub={`${fmtNaira(s?.monthlyRevenue ?? 0)} this month`} icon={TrendingUp} />
            <AdminKpiCard label="Enrollments" value={String(s?.activeEnrollments ?? 0)} sub={`${s?.activeSubscriptions ?? 0} subscriptions`} icon={Activity} />
            <AdminKpiCard label="Platform Revenue" value={fmtNaira(s?.platformRevenue ?? 0)} sub={`Reserve ${fmtNaira(s?.studentReserve ?? 0)}`} icon={Wallet} />
            <AdminKpiCard label="Live Sessions" value={String(s?.liveSessions ?? 0)} sub="All time" icon={Video} />
            <AdminKpiCard label="Certificates" value={String(s?.certificates ?? 0)} sub="Issued" icon={Award} />
            <AdminKpiCard label="Newsletter" value={String(s?.newsletterSubscribers ?? 0)} sub="Subscribers" icon={Mail} />
            <AdminKpiCard label="Courses" value={String(s?.publishedCourses ?? 0)} sub={`${s?.draftCourses ?? 0} drafts`} icon={GraduationCap} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {chart("Revenue trend", "Last 6 months", (
          <ChartContainer config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }} className="h-[220px] w-full">
            <AreaChart data={data?.revenueChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ))}

        {chart("New sign-ups", "Last 6 months", (
          <ChartContainer config={{ signups: { label: "Sign-ups", color: "var(--chart-2)" } }} className="h-[220px] w-full">
            <BarChart data={data?.signupsChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ))}

        {chart("Enrollments", "New enrollments per month", (
          <ChartContainer config={{ enrollments: { label: "Enrollments", color: "var(--chart-3)" } }} className="h-[220px] w-full">
            <BarChart data={data?.enrollmentsChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ))}

        {chart("Revenue split", "Gross · platform · tutor", (
          <ChartContainer config={{ gross: { label: "Gross", color: "var(--chart-1)" }, platform: { label: "Platform", color: "var(--chart-3)" }, tutor: { label: "Tutor", color: "var(--chart-2)" } }} className="h-[220px] w-full">
            <BarChart data={data?.splitChart ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="gross" fill="var(--color-gross)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="platform" fill="var(--color-platform)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tutor" fill="var(--color-tutor)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {chart("Users by role", "Platform composition", (
          <ChartContainer config={{ count: { label: "Users", color: "var(--chart-1)" } }} className="h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={data?.roleChart ?? []} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={2}>
                {(data?.roleChart ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="role" />} />
            </PieChart>
          </ChartContainer>
        ))}

        {chart("Payment status", "All payment records", (
          <ChartContainer config={{ count: { label: "Count", color: "var(--chart-1)" } }} className="h-[200px] w-full">
            <BarChart data={data?.paymentStatus ?? []} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="status" width={72} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        ))}

        {chart("Order status", "All checkout orders", (
          <ChartContainer config={{ count: { label: "Count", color: "var(--chart-2)" } }} className="h-[200px] w-full">
            <BarChart data={data?.orderStatus ?? []} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="status" width={72} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        ))}
      </div>

      {data?.topCourses && data.topCourses.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-base font-semibold">Top courses by enrollment</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("courses")}>
              Manage
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Students</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.topCourses.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{c.title}</td>
                  <td className="px-5 py-3 capitalize">{c.status}</td>
                  <td className="px-5 py-3 text-right">{c.students}</td>
                  <td className="px-5 py-3 text-right">{fmtNaira(c.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
