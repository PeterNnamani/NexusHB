"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { consumeDashboardPathCookie } from "@/contexts/site-view-context"
import { maskBrowserUrl } from "@/lib/masked-routing"

type DashboardPathContextValue = {
  path: string
  navigate: (path: string) => void
}

const DashboardPathContext = createContext<DashboardPathContextValue | null>(null)

const DEFAULT_PATH = "/dashboard"
const PENDING_DASHBOARD_PATH_KEY = "nexus_pending_dashboard_path"

/** Survives React Strict Mode remounts after sessionStorage is consumed. */
let rememberedDashboardPath: string | null = null

function consumePendingDashboardPath(): string | null {
  if (typeof window === "undefined") return null
  const pending = sessionStorage.getItem(PENDING_DASHBOARD_PATH_KEY)
  if (pending?.startsWith("/dashboard")) {
    sessionStorage.removeItem(PENDING_DASHBOARD_PATH_KEY)
    return pending
  }
  const fromCookie = consumeDashboardPathCookie()
  if (fromCookie?.startsWith("/dashboard")) return fromCookie
  return null
}

export function DashboardPathProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => {
    const consumed = consumePendingDashboardPath()
    if (consumed) rememberedDashboardPath = consumed
    return rememberedDashboardPath || DEFAULT_PATH
  })

  useEffect(() => {
    const consumed = consumePendingDashboardPath()
    if (consumed) {
      rememberedDashboardPath = consumed
      setPath(consumed)
    }
    maskBrowserUrl("/")
  }, [])

  const navigate = useCallback((next: string) => {
    const normalized = next.startsWith("/dashboard") ? next : DEFAULT_PATH
    rememberedDashboardPath = normalized || DEFAULT_PATH
    setPath(rememberedDashboardPath)
    maskBrowserUrl("/")
  }, [])

  return (
    <DashboardPathContext.Provider value={{ path, navigate }}>
      {children}
    </DashboardPathContext.Provider>
  )
}

export function useDashboardPath() {
  const ctx = useContext(DashboardPathContext)
  if (!ctx) throw new Error("useDashboardPath must be used within DashboardPathProvider")
  return ctx
}

export function useDashboardPathOptional() {
  return useContext(DashboardPathContext)
}

export function useDashboardQuery() {
  const ctx = useContext(DashboardPathContext)
  const raw = ctx?.path.includes("?") ? ctx.path.split("?")[1] : ""
  return useMemo(() => new URLSearchParams(raw), [raw])
}

export function dashboardPathBase(path: string) {
  return path.split("?")[0]
}
