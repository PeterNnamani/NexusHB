import { CheckCircle, PlayCircle, Trophy, BookOpen } from "lucide-react"

const activities = [
  {
    id: 1,
    icon: CheckCircle,
    title: "Completed lesson",
    description: "CSS Flexbox Basics",
    time: "2 hours ago",
    color: "text-primary bg-primary/10",
  },
  {
    id: 2,
    icon: PlayCircle,
    title: "Started lesson",
    description: "CSS Grid Layout",
    time: "3 hours ago",
    color: "text-secondary bg-secondary/10",
  },
  {
    id: 3,
    icon: Trophy,
    title: "Earned badge",
    description: "HTML Master",
    time: "Yesterday",
    color: "text-chart-4 bg-chart-4/10",
  },
  {
    id: 4,
    icon: BookOpen,
    title: "Enrolled in course",
    description: "TypeScript Complete",
    time: "2 days ago",
    color: "text-chart-5 bg-chart-5/10",
  },
]

export function DashboardActivity() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${activity.color} flex-shrink-0`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
            {index < activities.length - 1 && (
              <div className="absolute left-[26px] top-12 bottom-0 w-px bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
