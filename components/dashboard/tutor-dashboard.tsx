"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  DollarSign,
  Users,
  Star,
  BookOpen,
  MessageSquare,
  Calendar,
  Award,
} from "lucide-react"

interface TutorStats {
  totalEarnings: number
  monthlyEarnings: number
  activeStudents: number
  coursesTaught: number
  averageRating: number
  courses: { id: string; title: string; students_count: number }[]
  recentEarnings: { amount: number; student: string; course: string; date: string }[]
}

export function TutorDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] || "there"
  const [stats, setStats] = useState<TutorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tutor/stats")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStats(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">Manage your courses and track your earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats?.totalEarnings ?? 0)}</div>
            <p className="text-xs text-muted-foreground">{fmt(stats?.monthlyEarnings ?? 0)} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeStudents ?? 0}</div>
            <p className="text-xs text-muted-foreground">Across your courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Taught</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coursesTaught ?? 0}</div>
            <p className="text-xs text-muted-foreground">Published courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageRating || "—"}</div>
            <p className="text-xs text-muted-foreground">Across your courses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Earnings
              </CardTitle>
              <CardDescription>Your revenue from course sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600">{fmt(stats?.totalEarnings ?? 0)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recent Sales</h4>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : stats?.recentEarnings?.length ? (
                  stats.recentEarnings.map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{earning.course}</p>
                        <p className="text-sm text-muted-foreground">{earning.date}</p>
                      </div>
                      <p className="font-medium text-green-600">+{fmt(earning.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No sales yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.courses?.length ? (
                stats.courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <p className="font-medium">{c.title}</p>
                    <span className="text-sm text-muted-foreground">{c.students_count} students</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">You have no courses yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/my-courses?view=created" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Courses
                </Button>
              </Link>
              <Link href="/dashboard/students" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Students
                </Button>
              </Link>
              <Link href="/dashboard/earnings" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Earnings
                </Button>
              </Link>
              <Link href="/dashboard/messages" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
              <Link href="/dashboard/schedule" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </Link>
              <Link href="/dashboard/settings" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
