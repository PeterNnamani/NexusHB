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
  ADMIN_VIEW_COOKIE,
  adminViewFromPath,
  clearCookie,
  maskBrowserUrl,
  readCookie,
  type AdminViewId,
} from "@/lib/masked-routing"

type AdminViewContextValue = {
  view: AdminViewId
  navigate: (view: AdminViewId) => void
}

const AdminViewContext = createContext<AdminViewContextValue | null>(null)

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AdminViewId>("overview")

  useEffect(() => {
    const fromCookie = readCookie(ADMIN_VIEW_COOKIE)
    if (fromCookie) {
      clearCookie(ADMIN_VIEW_COOKIE)
      setView(fromCookie as AdminViewId)
    } else if (typeof window !== "undefined") {
      const fromPath = adminViewFromPath(window.location.pathname)
      if (fromPath !== "overview" || window.location.pathname !== "/admin") {
        setView(fromPath)
      }
    }
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      maskBrowserUrl("/admin")
    }
  }, [])

  const navigate = useCallback((next: AdminViewId) => {
    setView(next)
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      maskBrowserUrl("/admin")
    }
  }, [])

  return (
    <AdminViewContext.Provider value={{ view, navigate }}>
      {children}
    </AdminViewContext.Provider>
  )
}

export function useAdminView() {
  const ctx = useContext(AdminViewContext)
  if (!ctx) throw new Error("useAdminView must be used within AdminViewProvider")
  return ctx
}
