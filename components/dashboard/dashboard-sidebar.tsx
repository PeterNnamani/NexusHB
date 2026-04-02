"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/my-courses", icon: BookOpen, label: "My Courses" },
  { href: "/dashboard/learning-path", icon: GraduationCap, label: "Learning Path" },
  { href: "/dashboard/certificates", icon: Trophy, label: "Certificates" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
  { href: "/dashboard/notes", icon: FileText, label: "Notes" },
]

const secondaryNav = [
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/faq", icon: HelpCircle, label: "Help & FAQ" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col glass-nav transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className={cn("flex items-center", isCollapsed && "justify-center w-full")}>
            <div className={cn("relative dark:invert transition-all", isCollapsed ? "w-8 h-8" : "w-24 h-8")}>
              <Image
                src="/images/Logo.jpeg"
                alt="Nexus Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand Button */}
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

        {/* Main Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
              alt="John Doe"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">John Doe</p>
                <p className="text-sm text-muted-foreground truncate">Premium Member</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Link href="/">
              <Button variant="ghost" className="w-full mt-3 justify-start text-muted-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-nav border-t border-border safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {mainNav.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
