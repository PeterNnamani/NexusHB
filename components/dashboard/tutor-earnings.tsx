"use client"

import { useEffect, useState } from "react"
import { DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FINANCE_RULES } from "@/lib/finance"

interface TutorStats {
  totalEarnings: number
  monthlyEarnings: number
  recentEarnings: { amount: number; student: string; course: string; date: string }[]
}

export function TutorEarnings() {
  const [stats, setStats] = useState<TutorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tutor/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Your tutor share ({FINANCE_RULES.tutorShareRate * 100}%) from course sales on the platform.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-3xl font-bold">{fmt(stats?.totalEarnings ?? 0)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-3xl font-bold">{fmt(stats?.monthlyEarnings ?? 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>Course purchases credited to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : stats?.recentEarnings?.length ? (
            <div className="divide-y divide-border">
              {stats.recentEarnings.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{e.course}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.student} · {e.date}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">+{fmt(e.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
              <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-800 dark:text-emerald-300">
                <DollarSign className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-sm text-muted-foreground">No sales yet. Publish a course to start earning.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
