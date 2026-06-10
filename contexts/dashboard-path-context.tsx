"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export function DashboardPathProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(DEFAULT_PATH)

  useEffect(() => {
    const pending = sessionStorage.getItem("nexus_pending_dashboard_path")
    if (pending?.startsWith("/dashboard")) {
      sessionStorage.removeItem("nexus_pending_dashboard_path")
      setPath(pending)
    } else {
      const fromCookie = consumeDashboardPathCookie()
      if (fromCookie?.startsWith("/dashboard")) {
        setPath(fromCookie)
      }
    }
    maskBrowserUrl("/")
  }, [])

  const navigate = useCallback((next: string) => {
    const normalized = next.startsWith("/dashboard") ? next : DEFAULT_PATH
    setPath(normalized || DEFAULT_PATH)
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
  return new URLSearchParams(raw)
}

export function dashboardPathBase(path: string) {
  return path.split("?")[0]
}
