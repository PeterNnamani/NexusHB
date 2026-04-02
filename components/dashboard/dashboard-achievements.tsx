import { Trophy, Star, Zap, Target, Award, Flame } from "lucide-react"

const achievements = [
  {
    id: 1,
    icon: Trophy,
    title: "First Course",
    description: "Complete your first course",
    earned: true,
  },
  {
    id: 2,
    icon: Flame,
    title: "7 Day Streak",
    description: "Learn for 7 days in a row",
    earned: true,
  },
  {
    id: 3,
    icon: Star,
    title: "Quick Learner",
    description: "Complete 10 lessons in a day",
    earned: true,
  },
  {
    id: 4,
    icon: Target,
    title: "Goal Setter",
    description: "Set and achieve a weekly goal",
    earned: false,
  },
  {
    id: 5,
    icon: Zap,
    title: "Speed Runner",
    description: "Complete a course in under a week",
    earned: false,
  },
  {
    id: 6,
    icon: Award,
    title: "Certificate Collector",
    description: "Earn 5 certificates",
    earned: false,
  },
]

export function DashboardAchievements() {
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
              achievement.earned
                ? "bg-primary/10"
                : "bg-muted/50 opacity-50"
            }`}
          >
            <div
              className={`p-2 rounded-full mb-2 ${
                achievement.earned
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
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
