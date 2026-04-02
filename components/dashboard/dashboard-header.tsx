"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const notifications = [
  {
    id: 1,
    title: "New lesson available",
    description: "React Hooks Deep Dive is now live",
    time: "5 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Achievement unlocked!",
    description: "You completed your first course",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "Weekly progress report",
    description: "You studied 12 hours this week",
    time: "1 day ago",
    unread: false,
  },
]

export function DashboardHeader() {
  const [showSearch, setShowSearch] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const unreadCount = notifications.filter((n) => n.unread).length

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 glass-nav px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
      {/* Mobile Menu */}
      <div className="lg:hidden">
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses, lessons..."
            className="pl-10 glass-card h-10"
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
      <div className="flex items-center gap-2">
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
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium flex-1">{notification.title}</span>
                  {notification.unread && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {notification.description}
                </span>
                <span className="text-xs text-muted-foreground">
                  {notification.time}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
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
                  {user?.email || "user@example.com"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/certificates">Certificates</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/faq">Help & Support</Link>
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
