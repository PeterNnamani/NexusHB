/** Cookie keys — short-lived, consumed on mount by client routers */
export const SITE_VIEW_COOKIE = "nexus_site_view"
export const DASHBOARD_PATH_COOKIE = "nexus_dashboard_path"
export const NEWS_SLUG_COOKIE = "nexus_news_slug"
export const ADMIN_VIEW_COOKIE = "nexus_admin_view"

export type AdminViewId =
  | "overview"
  | "analytics"
  | "finance"
  | "payments"
  | "orders"
  | "users"
  | "enrollments"
  | "subscriptions"
  | "courses"
  | "news"
  | "live-sessions"
  | "certificates"
  | "submissions"
  | "newsletter"
  | "operations"

export type SiteViewId =
  | "home"
  | "courses"
  | "programs"
  | "news"
  | "news-article"
  | "faq"
  | "contact"
  | "suggestions"
  | "login"
  | "signup"
  | "cart"
  | "dashboard"

export const ADMIN_SEGMENT_TO_VIEW: Record<string, AdminViewId> = {
  analytics: "analytics",
  finance: "finance",
  payments: "payments",
  orders: "orders",
  users: "users",
  enrollments: "enrollments",
  subscriptions: "subscriptions",
  courses: "courses",
  news: "news",
  "live-sessions": "live-sessions",
  certificates: "certificates",
  submissions: "submissions",
  newsletter: "newsletter",
  operations: "operations",
  upload: "overview",
  login: "overview",
}

export const SITE_SEGMENT_TO_VIEW: Record<string, SiteViewId> = {
  courses: "courses",
  programs: "programs",
  news: "news",
  faq: "faq",
  contact: "contact",
  suggestions: "suggestions",
  login: "login",
  signup: "signup",
  cart: "cart",
  dashboard: "dashboard",
  "setup-admin": "home",
}

export const ADMIN_VIEW_LABELS: Record<AdminViewId, string> = {
  overview: "Platform Overview",
  analytics: "Analytics",
  finance: "Treasury",
  payments: "Payments",
  orders: "Orders",
  users: "Users",
  enrollments: "Enrollments",
  subscriptions: "Subscriptions",
  courses: "Courses",
  news: "News",
  "live-sessions": "Live Sessions",
  certificates: "Certificates",
  submissions: "Submissions",
  newsletter: "Newsletter",
  operations: "Operations",
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0`
}

export function maskBrowserUrl(path: "/" | "/admin") {
  if (typeof window === "undefined") return
  const target = `${window.location.origin}${path}`
  if (window.location.href !== target) {
    window.history.replaceState(window.history.state, "", path)
  }
}

export function adminViewFromPath(pathname: string): AdminViewId {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0]
  if (!segment) return "overview"
  return ADMIN_SEGMENT_TO_VIEW[segment] ?? "overview"
}

export function siteViewFromPath(pathname: string): SiteViewId {
  if (pathname === "/" || pathname === "") return "home"
  if (pathname.startsWith("/dashboard")) return "dashboard"
  if (pathname.startsWith("/news/")) return "news-article"
  const segment = pathname.split("/")[1] || ""
  return SITE_SEGMENT_TO_VIEW[segment] ?? "home"
}
