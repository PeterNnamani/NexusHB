"use client"

import type { ReactNode } from "react"
import { useDashboardNavigate } from "@/hooks/use-dashboard-navigate"
import { cn } from "@/lib/utils"

type DashboardNavLinkProps = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function DashboardNavLink({ href, children, className, onClick }: DashboardNavLinkProps) {
  const go = useDashboardNavigate()

  const handleClick = () => {
    onClick?.()
    go(href)
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
