"use client"

import { Sparkles } from "lucide-react"
import { SiteNavLink } from "@/components/site/site-nav-link"

export function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] border-b border-white/10 bg-foreground text-background dark:border-white/[0.06] dark:bg-[var(--bg-elevated)] dark:text-zinc-200">
      <div className="container mx-auto flex min-h-7 items-center justify-center gap-2 px-4 py-1 text-center text-xs sm:text-sm">
        <p>
          <span className="mr-1 inline-flex items-center gap-1.5 font-semibold text-emerald-300 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" strokeWidth={1.75} />
            New
          </span>{" "}
          Earn in Naira while you learn —{" "}
          <SiteNavLink href="/signup" className="font-semibold underline underline-offset-2 hover:text-primary">
            start free today
          </SiteNavLink>
        </p>
      </div>
    </div>
  )
}
