"use client"

import { Video, Wallet, LayoutDashboard } from "lucide-react"
import { SiteNavLink } from "@/components/site/site-nav-link"

const paths = [
  {
    href: "/dashboard/live-classroom",
    icon: Video,
    title: "Live classroom",
    description: "Join tutors in real-time sessions",
  },
  {
    href: "/dashboard/upgrade",
    icon: Wallet,
    title: "Plans & pricing",
    description: "Student and tutor subscriptions",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    title: "Your dashboard",
    description: "Progress, tasks, and certificates",
  },
] as const

export function PlatformStrip() {
  return (
    <section className="border-y border-border/80 bg-muted/30">
      <div className="container mx-auto px-4 py-5 lg:py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {paths.map((path) => {
            const Icon = path.icon
            return (
              <SiteNavLink
                key={path.href}
                href={path.href}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3.5 transition-colors hover:border-primary/35 hover:bg-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {path.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">{path.description}</p>
                </div>
              </SiteNavLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
