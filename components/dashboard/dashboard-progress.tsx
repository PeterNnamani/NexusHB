"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function DashboardProgress() {
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState(
    dayLabels.map((day) => ({ day, lessons: 0 })),
  )
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    if (!user?.id) return
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    weekAgo.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from("lesson_progress")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", weekAgo.toISOString())

    const counts: Record<number, number> = {}
    let sum = 0
    for (const row of data || []) {
      if (!row.completed_at) continue
      const d = new Date(row.completed_at).getDay()
      counts[d] = (counts[d] || 0) + 1
      sum += 1
    }

    setWeeklyData(dayLabels.map((day, i) => ({ day, lessons: counts[i] || 0 })))
    setTotal(sum)
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Weekly Progress</h2>
          <p className="text-sm text-muted-foreground">Lessons completed this week</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground">lessons</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px hsl(var(--foreground) / 0.1)",
              }}
              formatter={(value: number) => [`${value} lessons`, "Completed"]}
            />
            <Area
              type="monotone"
              dataKey="lessons"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLessons)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
