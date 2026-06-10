"use client"

import { useState } from "react"
import { dashboardPathBase, useDashboardPath } from "@/contexts/dashboard-path-context"
import { useSiteView } from "@/contexts/site-view-context"
import { NexusLogo } from "@/components/brand/nexus-logo"
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Trophy,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Calendar,
  Video,
  FileText,
  Wallet,
  Users,
  BarChart3,
  Shield,
  Award,
  Clock,
  DollarSign,
  Library,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { isStaffRole, normalizeRole } from "@/lib/admin"

type DashboardRole = "student" | "tutor"

const getNavConfig = (role: DashboardRole) => {
  switch (role) {
    case "student":
      return {
        mainNav: [
          { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
          { href: "/dashboard/browse-courses", icon: BookOpen, label: "Browse Courses" },
          { href: "/dashboard/my-courses", icon: GraduationCap, label: "My Courses" },
          { href: "/dashboard/tasks-milestones", icon: Trophy, label: "Tasks and Milestones" },
          { href: "/dashboard/leaderboard", icon: Award, label: "Leaderboard" },
          { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
          { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
          { href: "/dashboard/live-classroom", icon: Video, label: "Live Classroom" },
          { href: "/dashboard/certificates", icon: FileText, label: "Certificates" },
        ],
        secondaryNav: [
          { href: "/dashboard/upgrade", icon: Shield, label: "Learning Plans" },
          { href: "/dashboard/settings", icon: Settings, label: "Settings" },
          { href: "/faq", icon: HelpCircle, label: "Help & FAQ" },
        ],
      }
    case "tutor":
      return {
        mainNav: [
          { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/dashboard/browse-courses", icon: Library, label: "Browse Courses" },
          { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
          { href: "/dashboard/students", icon: Users, label: "Students" },
          { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
          { href: "/dashboard/live-classroom", icon: Video, label: "Live Classroom" },
          { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
          { href: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
          { href: "/dashboard/certificates", icon: Award, label: "Certifications" },
        ],
        secondaryNav: [
          { href: "/dashboard/upgrade", icon: Shield, label: "Teaching Plans" },
          { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
          { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
          { href: "/dashboard/settings", icon: Settings, label: "Settings" },
          { href: "/faq", icon: HelpCircle, label: "Help & FAQ" },
        ],
      }
    default:
      return { mainNav: [], secondaryNav: [] }
  }
}

export function DashboardSidebar() {
  const { path, navigate } = useDashboardPath()
  const { navigate: siteNavigate } = useSiteView()
  const pathBase = dashboardPathBase(path)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const normalizedRole = normalizeRole(user?.role)
  const dashboardRole: DashboardRole =
    normalizedRole === "tutor" || normalizedRole === "admin" ? "tutor" : "student"
  const roleLabel = dashboardRole.replace(/^\w/, (c) => c.toUpperCase())
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const { mainNav, secondaryNav } = getNavConfig(dashboardRole)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathBase === href
    return pathBase.startsWith(href)
  }

  const go = (href: string) => {
    if (href === "/faq") {
      siteNavigate("faq")
      return
    }
    navigate(href)
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col glass-nav transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={cn("flex items-center", isCollapsed && "justify-center w-full")}>
            <NexusLogo
              href="/"
              size={isCollapsed ? "sidebar-icon" : "sidebar"}
              className="max-w-full"
            />
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="mx-auto mb-4 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        )}

        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold capitalize">{roleLabel}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {mainNav.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3.5 rounded-xl text-base transition-all",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted font-medium",
                isCollapsed && "justify-center px-0",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          {secondaryNav.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3.5 rounded-xl text-base font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed && "justify-center px-0",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {!isCollapsed && user?.role === "student" && (
          <div className="px-3 py-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/dashboard/upgrade?view=tutor")}
            >
              <Shield className="h-5 w-5 mr-2" />
              Upgrade to Tutor
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                {initials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name || "Your account"}</p>
                <p className="text-sm text-muted-foreground truncate">{roleLabel}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              onClick={() => void logout()}
              className="w-full mt-3 justify-start text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          )}
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-nav border-t border-border safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {mainNav.slice(0, 5).map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive(item.href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
