"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Newspaper,
  Inbox,
  Users,
  LogOut,
  ExternalLink,
  Shield,
  Wallet,
  Workflow,
  BarChart3,
  CreditCard,
  ShoppingCart,
  GraduationCap,
  Repeat,
  Video,
  Award,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NexusLogo } from "@/components/brand/nexus-logo"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useAdminView } from "@/contexts/admin-view-context"
import { ADMIN_NAV_SECTIONS } from "@/lib/admin"

const iconMap = {
  LayoutDashboard,
  BookOpen,
  Newspaper,
  Inbox,
  Users,
  Wallet,
  Workflow,
  BarChart3,
  CreditCard,
  ShoppingCart,
  GraduationCap,
  Repeat,
  Video,
  Award,
  Mail,
} as const

export function AdminSidebar() {
  const router = useRouter()
  const { email, logout } = useAdminAuth()
  const { view, navigate } = useAdminView()

  const initials = (email || "Admin")
    .split(/[@.]/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    router.replace("/admin")
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:flex w-[17rem] flex-col border-r border-border bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0 overflow-hidden">
        <button
          type="button"
          onClick={() => navigate("overview")}
          className="flex flex-col gap-1 text-left w-full min-w-0"
        >
          <NexusLogo href={null} size="sidebar-lg" className="max-w-full" />
          <p className="text-[10px] text-foreground/50 truncate">Platform control panel</p>
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap]
                const active = view === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={cn(
                      "w-full",
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                      active
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2 : 1.75} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-0.5 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Site
        </Link>
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate text-foreground">{email || "Admin"}</p>
            <p className="text-[10px] text-foreground/50 flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" />
              Platform admin
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-foreground/60 hover:text-foreground hover:bg-muted h-8 text-xs"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Log out
        </Button>
      </div>
    </aside>
  )
}
