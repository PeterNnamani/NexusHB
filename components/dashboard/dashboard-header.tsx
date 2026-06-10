"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDashboardPathOptional } from "@/contexts/dashboard-path-context"
import { useSiteViewOptional } from "@/contexts/site-view-context"
import { Bell, Search, Menu, X, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  at: number
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function DashboardHeader() {
  const [showSearch, setShowSearch] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const dashboardPath = useDashboardPathOptional()
  const siteView = useSiteViewOptional()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { getItemCount } = useCart()
  const cartCount = getItemCount()

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    const [certRes, eventRes] = await Promise.all([
      supabase
        .from("certificates")
        .select("id, issued_at, courses(title)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, title, start_at")
        .eq("user_id", user.id)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3),
    ])

    const items: Notification[] = []
    for (const c of certRes.data || []) {
      const row = c as any
      items.push({
        id: `cert-${row.id}`,
        title: "Certificate earned",
        description: `You earned a certificate for ${row.courses?.title || "a course"}`,
        time: timeAgo(row.issued_at),
        at: new Date(row.issued_at).getTime(),
      })
    }
    for (const e of eventRes.data || []) {
      const row = e as any
      items.push({
        id: `event-${row.id}`,
        title: "Upcoming event",
        description: `${row.title} on ${new Date(row.start_at).toLocaleDateString()}`,
        time: timeAgo(row.start_at),
        at: new Date(row.start_at).getTime(),
      })
    }
    items.sort((a, b) => b.at - a.at)
    setNotifications(items.slice(0, 5))
  }, [user?.id])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = notifications.length

  const handleLogout = async () => {
    await logout()
  }

  const goDashboard = (path: string) => {
    if (dashboardPath) {
      dashboardPath.navigate(path)
      return
    }
    router.push(path)
  }

  const goFaq = () => {
    if (siteView) {
      siteView.navigate("faq")
      return
    }
    router.push("/faq")
  }

  return (
    <header className="dashboard-header fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-4 glass-nav px-4 backdrop-blur-xl lg:left-64 lg:px-8">
      {/* Mobile Menu */}
      <div className="lg:hidden">
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="hidden min-w-0 max-w-xl flex-1 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses, lessons..."
            className="h-11 pl-10 glass-card font-medium"
          />
        </div>
      </div>

      {/* Mobile Search Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-10 w-10"
        onClick={() => setShowSearch(!showSearch)}
      >
        {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </Button>

      {/* Actions */}
      <div className="relative z-10 flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
          onClick={() => goDashboard("/dashboard/cart")}
          aria-label="Shopping cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium flex-1">{notification.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {notification.time}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 px-2 gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden sm:block font-medium">{user?.name?.split(" ")[0] || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name || "User"}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {user?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => goDashboard("/dashboard/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => goDashboard("/dashboard/certificates")}
            >
              Certificates
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={goFaq}>
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 p-4 glass-nav md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, lessons..."
              className="pl-10 h-12"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
