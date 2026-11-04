"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, type ReactNode } from "react"
import { dashboardPathBase, useDashboardPath } from "@/contexts/dashboard-path-context"
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton"

const MINIMUM_SHIMMER_DURATION_MS = 3000
const loading = () => <DashboardPageSkeleton />

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
  const [minimumElapsedPath, setMinimumElapsedPath] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMinimumElapsedPath(path),
      MINIMUM_SHIMMER_DURATION_MS,
    )
    return () => window.clearTimeout(timer)
  }, [path])

  let page: ReactNode
  const liveMatch = base.match(/^\/dashboard\/live-classroom\/([^/]+)$/)
  const courseMatch = base.match(/^\/dashboard\/(my-courses|browse-courses)\/([^/]+)$/)
  if (liveMatch) {
    page = <LiveClassroomRoom />
  } else if (courseMatch) {
    const browseCourses = courseMatch[1] === "browse-courses"
    page = (
      <MyCourseDetail
        courseId={courseMatch[2]}
        backHref={browseCourses ? "/dashboard/browse-courses" : "/dashboard/my-courses"}
      />
    )
  } else {
    switch (base) {
      case "/dashboard":
        page = <DashboardHome />
        break
      case "/dashboard/browse-courses":
        page = <BrowseCourses />
        break
      case "/dashboard/my-courses":
        page = <MyCourses />
        break
      case "/dashboard/tasks-milestones":
        page = <TasksMilestones />
        break
      case "/dashboard/leaderboard":
        page = <Leaderboard />
        break
      case "/dashboard/wallet":
        page = <Wallet />
        break
      case "/dashboard/messages":
        page = <Messages />
        break
      case "/dashboard/live-classroom":
        page = <LiveClassroom />
        break
      case "/dashboard/certificates":
        page = <Certificates />
        break
      case "/dashboard/upgrade":
        page = <Upgrade />
        break
      case "/dashboard/settings":
        page = <Settings />
        break
      case "/dashboard/schedule":
        page = <Schedule />
        break
      case "/dashboard/students":
        page = <Students />
        break
      case "/dashboard/earnings":
        page = <Earnings />
        break
      case "/dashboard/analytics":
        page = <Analytics />
        break
      case "/dashboard/notes":
        page = <Notes />
        break
      case "/dashboard/learning-path":
        page = <LearningPath />
        break
      case "/dashboard/cart":
        page = <DashboardCart />
        break
      default:
        page = <DashboardHome />
    }
  }

  const ready = minimumElapsedPath === path

  return (
    <div className="relative min-h-[65vh]" aria-busy={!ready}>
      <div
        className={ready ? "" : "pointer-events-none absolute inset-0 overflow-hidden opacity-0"}
        aria-hidden={!ready}
      >
        {page}
      </div>
      {!ready && (
        <div className="absolute inset-0 z-10 bg-background">
          <DashboardPageSkeleton />
        </div>
      )}
    </div>
  )
}
