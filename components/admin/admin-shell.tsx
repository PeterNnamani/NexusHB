"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ADMIN_NAV_SECTIONS } from "@/lib/admin"
import { ADMIN_VIEW_LABELS } from "@/lib/masked-routing"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useAdminView } from "@/contexts/admin-view-context"
import { cn } from "@/lib/utils"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { view, navigate } = useAdminView()
  const [mobileOpen, setMobileOpen] = useState(false)

  const mobileNav = ADMIN_NAV_SECTIONS.flatMap((s) => s.items)

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="lg:ml-[17rem] flex flex-col min-h-screen">
        <header className="dashboard-header sticky top-0 z-30 flex shrink-0 items-center justify-between glass-nav px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="outline" size="icon" onClick={() => setMobileOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-semibold text-sm">Nexus Admin</p>
              <p className="text-xs text-muted-foreground">Platform operator</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {ADMIN_VIEW_LABELS[view]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="hidden sm:block">
              <Button variant="outline" size="sm">
                Main site
              </Button>
            </Link>
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-border bg-background px-4 py-3 space-y-1">
            {mobileNav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "block w-full text-left py-2.5 text-sm font-medium rounded-lg px-3",
                  view === item.id
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
                onClick={() => {
                  navigate(item.id)
                  setMobileOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
