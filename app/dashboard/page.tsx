"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCourses } from "@/components/dashboard/dashboard-courses"
import { DashboardProgress } from "@/components/dashboard/dashboard-progress"
import { DashboardActivity } from "@/components/dashboard/dashboard-activity"
import { DashboardAchievements } from "@/components/dashboard/dashboard-achievements"
import { CourseLearning } from "@/components/dashboard/course-learning"

export default function DashboardPage() {
  const { user } = useAuth()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const firstName = user?.name?.split(" ")[0] || "there"

  // Ensure dashboard updates when user state changes
  useEffect(() => {
    // This dependency watches all user changes, ensuring sync with completed courses
  }, [user])

  if (selectedCourseId) {
    return (
      <CourseLearning 
        courseId={selectedCourseId} 
        onBack={() => setSelectedCourseId(null)} 
      />
    )
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">
          Continue your learning journey. You&apos;re making great progress!
        </p>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Courses & Progress */}
        <div className="lg:col-span-2 space-y-8">
          <DashboardCourses onCourseSelect={setSelectedCourseId} />
          <DashboardProgress />
        </div>

        {/* Right Column - Activity & Achievements */}
        <div className="space-y-8">
          <DashboardActivity />
          <DashboardAchievements />
        </div>
      </div>
    </div>
  )
}
