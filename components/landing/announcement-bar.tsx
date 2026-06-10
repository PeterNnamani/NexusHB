"use client"

import { Sparkles } from "lucide-react"
import { SiteNavLink } from "@/components/site/site-nav-link"

export function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-foreground text-background">
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm">
        <Sparkles className="hidden h-3.5 w-3.5 shrink-0 text-primary sm:block" />
        <p>
          <span className="font-semibold text-primary">New:</span>{" "}
          Earn in Naira while you learn —{" "}
          <SiteNavLink href="/signup" className="font-semibold underline underline-offset-2 hover:text-primary">
            start free today
          </SiteNavLink>
        </p>
      </div>
    </div>
  )
}
