"use client"

import { Trophy, Star, Zap, Target, Award, Flame } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function DashboardAchievements() {
  const { user } = useAuth()

  const enrolled = user?.enrolledCourses?.length ?? 0
  const completed = user?.completedCourses?.length ?? 0
  const streak = user?.streak ?? 0
  const points = user?.points ?? 0

  const achievements = [
    { id: 1, icon: Target, title: "Getting Started", description: "Enroll in your first course", earned: enrolled >= 1 },
    { id: 2, icon: Trophy, title: "First Course", description: "Complete your first course", earned: completed >= 1 },
    { id: 3, icon: Flame, title: "7 Day Streak", description: "Learn 7 days in a row", earned: streak >= 7 },
    { id: 4, icon: Zap, title: "Dedicated Learner", description: "Enroll in 3 courses", earned: enrolled >= 3 },
    { id: 5, icon: Star, title: "Point Collector", description: "Earn 100 points", earned: points >= 100 },
    { id: 6, icon: Award, title: "Certificate Collector", description: "Complete 5 courses", earned: completed >= 5 },
  ]

  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Achievements</h2>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{achievements.length} earned
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
              achievement.earned ? "bg-primary/10" : "bg-muted/50 opacity-50"
            }`}
            title={achievement.description}
          >
            <div
              className={`p-2 rounded-full mb-2 ${
                achievement.earned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <achievement.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium leading-tight">{achievement.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
