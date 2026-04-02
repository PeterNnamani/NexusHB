import { BookOpen, Clock, Trophy, Flame } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { courses } from "@/lib/courses"

export function DashboardStats() {
  const { user } = useAuth()

  // Calculate stats based on actual user data
  const enrolledCount = user?.enrolledCourses?.length ?? 0
  const completedCount = user?.completedCourses?.length ?? 0
  const inProgressCount = enrolledCount - completedCount
  const streak = user?.streak ?? 0

  // Get total hours from enrolled courses
  const totalHours = courses
    .filter(c => user?.enrolledCourses?.includes(c.id))
    .reduce((sum, course) => {
      const hours = parseInt(course.duration) || 0
      return sum + hours
    }, 0)

  const stats = [
    {
      icon: BookOpen,
      label: "In Progress",
      value: inProgressCount.toString(),
      change: `${completedCount} completed`,
      color: "text-primary bg-primary/10",
    },
    {
      icon: Clock,
      label: "Total Hours",
      value: totalHours.toString(),
      change: "This month",
      color: "text-secondary bg-secondary/10",
    },
    {
      icon: Trophy,
      label: "Completed",
      value: completedCount.toString(),
      change: completedCount > 0 ? `${completedCount} course${completedCount !== 1 ? 's' : ''}` : "Get started",
      color: "text-chart-4 bg-chart-4/10",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: streak.toString(),
      change: streak > 0 ? "Keep it up!" : "Start learning",
      color: "text-chart-5 bg-chart-5/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-xs text-primary mt-2">{stat.change}</p>
        </div>
      ))}
    </div>
  )
}
