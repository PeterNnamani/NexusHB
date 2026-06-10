"use client"

import dynamic from "next/dynamic"
import { dashboardPathBase, useDashboardPath } from "@/contexts/dashboard-path-context"
import { Loader2 } from "lucide-react"

const loading = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

const DashboardHome = dynamic(() => import("@/app/dashboard/page"), { loading })
const BrowseCourses = dynamic(() => import("@/app/dashboard/browse-courses/page"), { loading })
const MyCourses = dynamic(() => import("@/app/dashboard/my-courses/page"), { loading })
const TasksMilestones = dynamic(() => import("@/app/dashboard/tasks-milestones/page"), { loading })
const Leaderboard = dynamic(() => import("@/app/dashboard/leaderboard/page"), { loading })
const Wallet = dynamic(() => import("@/app/dashboard/wallet/page"), { loading })
const Messages = dynamic(() => import("@/app/dashboard/messages/page"), { loading })
const LiveClassroom = dynamic(() => import("@/app/dashboard/live-classroom/page"), { loading })
const LiveClassroomRoom = dynamic(() => import("@/app/dashboard/live-classroom/[id]/page"), { loading })
const Certificates = dynamic(() => import("@/app/dashboard/certificates/page"), { loading })
const Upgrade = dynamic(() => import("@/app/dashboard/upgrade/page"), { loading })
const Settings = dynamic(() => import("@/app/dashboard/settings/page"), { loading })
const Schedule = dynamic(() => import("@/app/dashboard/schedule/page"), { loading })
const Students = dynamic(() => import("@/app/dashboard/students/page"), { loading })
const Earnings = dynamic(() => import("@/app/dashboard/earnings/page"), { loading })
const Analytics = dynamic(() => import("@/app/dashboard/analytics/page"), { loading })
const Notes = dynamic(() => import("@/app/dashboard/notes/page"), { loading })
const LearningPath = dynamic(() => import("@/app/dashboard/learning-path/page"), { loading })
const DashboardCart = dynamic(() => import("@/app/dashboard/cart/page"), { loading })
const MyCourseDetail = dynamic(() => import("@/components/dashboard/my-course-detail-view"), { loading })

export function DashboardPathRenderer() {
  const { path } = useDashboardPath()
  const base = dashboardPathBase(path)

  const liveMatch = base.match(/^\/dashboard\/live-classroom\/([^/]+)$/)
  if (liveMatch) return <LiveClassroomRoom />

  const courseMatch = base.match(/^\/dashboard\/my-courses\/([^/]+)$/)
  if (courseMatch) return <MyCourseDetail courseId={courseMatch[1]} />

  switch (base) {
    case "/dashboard":
      return <DashboardHome />
    case "/dashboard/browse-courses":
      return <BrowseCourses />
    case "/dashboard/my-courses":
      return <MyCourses />
    case "/dashboard/tasks-milestones":
      return <TasksMilestones />
    case "/dashboard/leaderboard":
      return <Leaderboard />
    case "/dashboard/wallet":
      return <Wallet />
    case "/dashboard/messages":
      return <Messages />
    case "/dashboard/live-classroom":
      return <LiveClassroom />
    case "/dashboard/certificates":
      return <Certificates />
    case "/dashboard/upgrade":
      return <Upgrade />
    case "/dashboard/settings":
      return <Settings />
    case "/dashboard/schedule":
      return <Schedule />
    case "/dashboard/students":
      return <Students />
    case "/dashboard/earnings":
      return <Earnings />
    case "/dashboard/analytics":
      return <Analytics />
    case "/dashboard/notes":
      return <Notes />
    case "/dashboard/learning-path":
      return <LearningPath />
    case "/dashboard/cart":
      return <DashboardCart />
    default:
      return <DashboardHome />
  }
}
