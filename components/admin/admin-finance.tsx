"use client"

import { useEffect, useState } from "react"
import {
  Wallet,
  GraduationCap,
  Users,
  CreditCard,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { fmtNaira } from "@/lib/finance"
import { adminFetch, invalidateAdminFetch } from "@/lib/admin-fetch"
import { useToast } from "@/hooks/use-toast"

interface FinanceData {
  summary: {
    grossCollected: number
    platformRevenue: number
    tutorCreditsTotal: number
    studentReserveFromSales: number
    enrollmentReserve: number
    totalStudentReserve: number
    courseRevenue: number
    subscriptionRevenue: number
    refundedAmount: number
    failedPayments: number
    pendingOrders: number
    pendingOrderValue: number
    activeEnrollments: number
    activeSubscriptions: number
    paymentCount: number
  }
  revenueChart: { month: string; gross: number; platform: number; tutor: number }[]
  recentPayments: {
    id: string
    reference: string
    amount: number
    status: string
    category: string
    payer: string
    item: string
    platformFee: number
    tutorCredit: number
    studentReserve: number
    paidAt: string | null
  }[]
  studentReserves: {
    student: string
    course: string
    progress: number
    maxPayout: number
    reserved: number
    enrolledAt: string | null
  }[]
  staffCredits: {
    id: string
    name: string
    role: string
    credited: number
    courses: number
  }[]
  pendingOrders: {
    reference: string
    amount: number
    status: string
    item: string
    payer: string
    createdAt: string
  }[]
}

const chartConfig = {
  gross: { label: "Gross", color: "var(--chart-1)" },
  tutor: { label: "Tutor", color: "var(--chart-3)" },
  platform: { label: "Platform", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatMonth(key: string) {
  const [y, m] = key.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-NG", { month: "short" })
}

export function AdminFinance() {
  const { toast } = useToast()
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async (fresh = false) => {
    setLoading(true)
    if (fresh) invalidateAdminFetch("/api/admin/finance")
    try {
      setData(await adminFetch<FinanceData>("/api/admin/finance", { ttlMs: fresh ? 0 : undefined }))
    } catch {
      toast({ title: "Could not load finance data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const s = data?.summary

  return (
    <div className="space-y-10 w-full max-w-[1400px]">
      <AdminPageHeader
        title="Finance & Treasury"
        description="Track every payment, revenue split, student payout reserve, and staff credit across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-[120px] rounded-2xl border border-border bg-muted/30 animate-pulse" />
          ))
        ) : (
          <>
            <AdminKpiCard label="Gross Collected" value={fmtNaira(s?.grossCollected ?? 0)} sub={`${s?.paymentCount ?? 0} successful payments`} icon={Wallet} />
            <AdminKpiCard label="Platform Revenue" value={fmtNaira(s?.platformRevenue ?? 0)} sub={`${fmtNaira(s?.subscriptionRevenue ?? 0)} from subscriptions`} icon={ArrowUpRight} />
            <AdminKpiCard label="Tutor Credits" value={fmtNaira(s?.tutorCreditsTotal ?? 0)} sub={`${fmtNaira(s?.courseRevenue ?? 0)} course sales`} icon={Users} />
            <AdminKpiCard label="Student Reserve" value={fmtNaira(s?.totalStudentReserve ?? 0)} sub={`${fmtNaira(s?.enrollmentReserve ?? 0)} from progress`} icon={GraduationCap} />
            <AdminKpiCard label="Sales Reserve" value={fmtNaira(s?.studentReserveFromSales ?? 0)} sub="15% held per course sale" icon={CreditCard} />
            <AdminKpiCard label="Pending Orders" value={String(s?.pendingOrders ?? 0)} sub={fmtNaira(s?.pendingOrderValue ?? 0)} icon={Clock} />
            <AdminKpiCard label="Active Enrollments" value={String(s?.activeEnrollments ?? 0)} sub="Students with course access" icon={GraduationCap} />
            <AdminKpiCard label="Refunded" value={fmtNaira(s?.refundedAmount ?? 0)} sub={`${s?.failedPayments ?? 0} failed attempts`} icon={ArrowDownLeft} />
          </>
        )}
      </div>

      {data?.revenueChart && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Revenue breakdown</h2>
          <p className="text-sm text-muted-foreground mb-6">Monthly gross, platform share, and tutor credits</p>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={data.revenueChart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickFormatter={(v) => `?${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={56} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="gross" fill="var(--color-gross)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="platform" fill="var(--color-platform)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tutor" fill="var(--color-tutor)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reserves">Student reserves</TabsTrigger>
          <TabsTrigger value="staff">Staff credits</TabsTrigger>
          <TabsTrigger value="pending">Pending orders</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-5 py-3">Reference</th>
                    <th className="text-left font-medium px-5 py-3">Payer</th>
                    <th className="text-left font-medium px-5 py-3">Item</th>
                    <th className="text-right font-medium px-5 py-3">Amount</th>
                    <th className="text-right font-medium px-5 py-3">Platform</th>
                    <th className="text-right font-medium px-5 py-3">Tutor</th>
                    <th className="text-right font-medium px-5 py-3">Reserve</th>
                    <th className="text-left font-medium px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : data?.recentPayments?.length ? (
                    data.recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-mono text-xs">{p.reference.slice(0, 12)}</td>
                        <td className="px-5 py-3">{p.payer}</td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className="capitalize text-xs mr-2">
                            {p.category}
                          </Badge>
                          {p.item}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtNaira(p.amount)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{fmtNaira(p.platformFee)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{fmtNaira(p.tutorCredit)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{fmtNaira(p.studentReserve)}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "?"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                        No payments yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reserves">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <p className="px-5 py-4 text-sm text-muted-foreground border-b border-border">
              Funds reserved for student milestone payouts, weighted by course progress and earnings potential.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-5 py-3">Student</th>
                    <th className="text-left font-medium px-5 py-3">Course</th>
                    <th className="text-right font-medium px-5 py-3">Progress</th>
                    <th className="text-right font-medium px-5 py-3">Max payout</th>
                    <th className="text-right font-medium px-5 py-3">Reserved</th>
                    <th className="text-left font-medium px-5 py-3">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.studentReserves?.length ? (
                    data.studentReserves.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-5 py-3">{r.student}</td>
                        <td className="px-5 py-3">{r.course}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{r.progress}%</td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{fmtNaira(r.maxPayout)}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtNaira(r.reserved)}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString() : "?"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                        No active enrollments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <p className="px-5 py-4 text-sm text-muted-foreground border-b border-border">
              Tutor credits ? 70% of each course sale credited to the course instructor.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-5 py-3">Staff</th>
                    <th className="text-left font-medium px-5 py-3">Role</th>
                    <th className="text-right font-medium px-5 py-3">Total credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.staffCredits?.length ? (
                    data.staffCredits.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium">{t.name}</td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {t.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtNaira(t.credited)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                        No tutor credits yet ? credits appear when course sales are recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-5 py-3">Reference</th>
                    <th className="text-left font-medium px-5 py-3">Payer</th>
                    <th className="text-left font-medium px-5 py-3">Item</th>
                    <th className="text-right font-medium px-5 py-3">Amount</th>
                    <th className="text-left font-medium px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.pendingOrders?.length ? (
                    data.pendingOrders.map((o) => (
                      <tr key={o.reference} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-mono text-xs">{o.reference.slice(0, 14)}</td>
                        <td className="px-5 py-3">{o.payer}</td>
                        <td className="px-5 py-3">{o.item}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtNaira(o.amount)}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "?"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        No pending orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
