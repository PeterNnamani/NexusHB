import { type NextRequest, NextResponse } from "next/server"
import {
  ADMIN_SEGMENT_TO_VIEW,
  ADMIN_VIEW_COOKIE,
  DASHBOARD_PATH_COOKIE,
  NEWS_SLUG_COOKIE,
  SITE_SEGMENT_TO_VIEW,
  SITE_VIEW_COOKIE,
} from "@/lib/masked-routing"

const STATIC_FILE = /\.[a-zA-Z0-9]+$/

function isExemptPath(path: string) {
  return (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/payment") ||
    path === "/favicon.ico" ||
    STATIC_FILE.test(path)
  )
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (isExemptPath(path)) {
    return NextResponse.next({ request })
  }

  // Admin: only /admin visible — fold /admin/* into /admin with a view cookie
  if (path.startsWith("/admin")) {
    if (path === "/admin" || path === "/admin/login") {
      return NextResponse.next({ request })
    }

    const segment = path.replace(/^\/admin\/?/, "").split("/")[0]
    const view = ADMIN_SEGMENT_TO_VIEW[segment] ?? "overview"
    const res = NextResponse.redirect(new URL("/admin", request.url))
    res.cookies.set(ADMIN_VIEW_COOKIE, view, { maxAge: 15, path: "/" })
    return res
  }

  // Public site: only / visible — fold everything else into /
  if (path !== "/") {
    const res = NextResponse.redirect(new URL("/", request.url))

    if (path.startsWith("/dashboard")) {
      res.cookies.set(SITE_VIEW_COOKIE, "dashboard", { maxAge: 15, path: "/" })
      res.cookies.set(
        DASHBOARD_PATH_COOKIE,
        path + request.nextUrl.search,
        { maxAge: 15, path: "/" },
      )
      return res
    }

    if (path.startsWith("/news/")) {
      const slug = path.replace(/^\/news\//, "").split("/")[0]
      res.cookies.set(SITE_VIEW_COOKIE, "news-article", { maxAge: 15, path: "/" })
      if (slug) res.cookies.set(NEWS_SLUG_COOKIE, slug, { maxAge: 15, path: "/" })
      return res
    }

    const segment = path.split("/")[1] || ""
    const view = SITE_SEGMENT_TO_VIEW[segment]
    if (view) {
      res.cookies.set(SITE_VIEW_COOKIE, view, { maxAge: 15, path: "/" })
    }
    return res
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
