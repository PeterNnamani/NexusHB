"use client"

import { PublicViewRenderer } from "@/components/site/public-views"
import { useSiteView } from "@/contexts/site-view-context"

export function SiteClientShell({ children }: { children: React.ReactNode }) {
  const { view } = useSiteView()
  if (view === "home") return <>{children}</>
  return <PublicViewRenderer />
}
