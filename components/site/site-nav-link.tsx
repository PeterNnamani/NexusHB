"use client"

import type { ReactNode } from "react"
import { useSiteView } from "@/contexts/site-view-context"
import { SITE_SEGMENT_TO_VIEW, type SiteViewId } from "@/lib/masked-routing"
import { cn } from "@/lib/utils"

function hrefToView(href: string): SiteViewId | null {
  if (href === "/" || href === "") return "home"
  if (href.startsWith("/news/")) return "news-article"
  if (href.startsWith("/dashboard")) return "dashboard"
  const segment = href.replace(/^\//, "").split("/")[0]
  return SITE_SEGMENT_TO_VIEW[segment] ?? null
}

type SiteNavLinkProps = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

/** Client navigation that keeps the URL at `/`. */
export function SiteNavLink({ href, children, className, onClick }: SiteNavLinkProps) {
  const { navigate } = useSiteView()

  const handleClick = () => {
    onClick?.()
    const view = hrefToView(href)
    if (!view) return
    if (view === "news-article") {
      const slug = href.replace(/^\/news\//, "").split("/")[0]
      navigate("news-article", { newsSlug: slug || null })
      return
    }
    if (view === "dashboard") {
      const path = href.startsWith("/dashboard") ? href : "/dashboard"
      sessionStorage.setItem("nexus_pending_dashboard_path", path)
      navigate("dashboard")
      return
    }
    navigate(view)
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </span>
  )
}
