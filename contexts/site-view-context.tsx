"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  clearCookie,
  DASHBOARD_PATH_COOKIE,
  maskBrowserUrl,
  NEWS_SLUG_COOKIE,
  readCookie,
  SITE_VIEW_COOKIE,
  siteViewFromPath,
  type SiteViewId,
} from "@/lib/masked-routing"

type SiteViewContextValue = {
  view: SiteViewId
  newsSlug: string | null
  navigate: (view: SiteViewId, opts?: { newsSlug?: string | null }) => void
}

const SiteViewContext = createContext<SiteViewContextValue | null>(null)

export function SiteViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<SiteViewId>("home")
  const [newsSlug, setNewsSlug] = useState<string | null>(null)

  useEffect(() => {
    const fromCookie = readCookie(SITE_VIEW_COOKIE)
    const slugCookie = readCookie(NEWS_SLUG_COOKIE)

    if (fromCookie) {
      clearCookie(SITE_VIEW_COOKIE)
      setView(fromCookie as SiteViewId)
    } else if (typeof window !== "undefined") {
      setView(siteViewFromPath(window.location.pathname))
    }

    if (slugCookie) {
      clearCookie(NEWS_SLUG_COOKIE)
      setNewsSlug(slugCookie)
    }

    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
      maskBrowserUrl("/")
    }
  }, [])

  const navigate = useCallback(
    (next: SiteViewId, opts?: { newsSlug?: string | null }) => {
      setView(next)
      if (opts?.newsSlug !== undefined) setNewsSlug(opts.newsSlug)
      maskBrowserUrl("/")
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [],
  )

  return (
    <SiteViewContext.Provider value={{ view, newsSlug, navigate }}>
      {children}
    </SiteViewContext.Provider>
  )
}

export function useSiteView() {
  const ctx = useContext(SiteViewContext)
  if (!ctx) throw new Error("useSiteView must be used within SiteViewProvider")
  return ctx
}

export function useSiteViewOptional() {
  return useContext(SiteViewContext)
}

/** Consume dashboard path cookie once (called from dashboard path provider). */
export function consumeDashboardPathCookie(): string | null {
  const path = readCookie(DASHBOARD_PATH_COOKIE)
  if (path) clearCookie(DASHBOARD_PATH_COOKIE)
  return path
}
