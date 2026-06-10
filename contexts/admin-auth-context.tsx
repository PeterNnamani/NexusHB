"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type AdminAuthContextValue = {
  email: string | null
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<{ email: string }>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/session", {
        credentials: "include",
        cache: "no-store",
      })
      if (!res.ok) {
        setEmail(null)
        return
      }
      const data = await res.json()
      setEmail(data.email ?? null)
    } catch {
      setEmail(null)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Login failed",
      )
    }
    const signedInEmail =
      typeof data.email === "string"
        ? data.email
        : email.trim().toLowerCase()
    setEmail(signedInEmail)
    return { email: signedInEmail }
  }, [])

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [refresh])

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    setEmail(null)
  }, [])

  const value = useMemo(
    () => ({
      email,
      isLoading,
      isAuthenticated: Boolean(email),
      refresh,
      login,
      logout,
    }),
    [email, isLoading, refresh, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return ctx
}
