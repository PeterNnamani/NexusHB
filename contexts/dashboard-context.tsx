"use client"

import { createContext, useContext, ReactNode } from "react"

type UserRole = "student" | "tutor" | "admin"

interface DashboardContextType {
  currentRole: UserRole
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({
  children,
  currentRole,
}: {
  children: ReactNode
  currentRole: UserRole
}) {
  return (
    <DashboardContext.Provider value={{ currentRole }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
