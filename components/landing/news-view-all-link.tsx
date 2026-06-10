"use client"

import { ArrowRight } from "lucide-react"
import { SiteNavLink } from "@/components/site/site-nav-link"

export function NewsViewAllLink() {
  return (
    <SiteNavLink
      href="/news"
      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
    >
      View all news
      <ArrowRight className="h-3.5 w-3.5" />
    </SiteNavLink>
  )
}
