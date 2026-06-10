export type StaffRole = "admin" | "tutor"

import type { AdminViewId } from "@/lib/masked-routing"

export type AdminNavItem = {
  id: AdminViewId
  label: string
  icon: string
}

export type AdminNavSection = {
  label: string
  items: AdminNavItem[]
}

/** Legacy agent accounts are treated as admin everywhere in the app. */
export function normalizeRole(role: string | undefined): string {
  if (role === "agent") return "admin"
  return role || "student"
}

export function isStaffRole(role: string | undefined): role is StaffRole {
  const r = normalizeRole(role)
  return r === "admin" || r === "tutor"
}

export function isAdminRole(role: string | undefined): boolean {
  return normalizeRole(role) === "admin"
}

export function isTutorRole(role: string | undefined): boolean {
  return normalizeRole(role) === "tutor"
}

export function canTeachCourses(role: string | undefined): boolean {
  const r = normalizeRole(role)
  return r === "admin" || r === "tutor"
}

/** Every platform area — platform operators only (separate admin login). */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: "LayoutDashboard" },
      { id: "analytics", label: "Analytics", icon: "BarChart3" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "finance", label: "Treasury", icon: "Wallet" },
      { id: "payments", label: "Payments", icon: "CreditCard" },
      { id: "orders", label: "Orders", icon: "ShoppingCart" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "users", label: "Users", icon: "Users" },
      { id: "enrollments", label: "Enrollments", icon: "GraduationCap" },
      { id: "subscriptions", label: "Subscriptions", icon: "Repeat" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "courses", label: "Courses", icon: "BookOpen" },
      { id: "news", label: "News", icon: "Newspaper" },
      { id: "live-sessions", label: "Live Sessions", icon: "Video" },
      { id: "certificates", label: "Certificates", icon: "Award" },
    ],
  },
  {
    label: "Community",
    items: [
      { id: "submissions", label: "Submissions", icon: "Inbox" },
      { id: "newsletter", label: "Newsletter", icon: "Mail" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "operations", label: "Operations", icon: "Workflow" },
    ],
  },
]

/** Flat list (legacy compat). */
export const ADMIN_NAV = {
  main: ADMIN_NAV_SECTIONS.flatMap((s) => s.items),
}
