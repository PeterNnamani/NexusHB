"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { DashboardApp } from "@/components/dashboard/dashboard-app"
import { useSiteView } from "@/contexts/site-view-context"
import type { SiteViewId } from "@/lib/masked-routing"

const loading = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

const CoursesView = dynamic(() => import("@/components/site/views/courses-view"), { loading })
const ProgramsView = dynamic(() => import("@/components/site/views/programs-view"), { loading })
const NewsView = dynamic(() => import("@/components/site/views/news-view"), { loading })
const NewsArticleView = dynamic(() => import("@/components/site/views/news-article-view"), { loading })
const FaqView = dynamic(() => import("@/components/site/views/faq-view"), { loading })
const ContactView = dynamic(() => import("@/components/site/views/contact-view"), { loading })
const SuggestionsView = dynamic(() => import("@/components/site/views/suggestions-view"), { loading })
const LoginView = dynamic(() => import("@/components/site/views/login-view"), { loading })
const SignupView = dynamic(() => import("@/components/site/views/signup-view"), { loading })
const CartView = dynamic(() => import("@/components/site/views/cart-view"), { loading })

export function PublicViewRenderer() {
  const { view } = useSiteView()

  switch (view) {
    case "courses":
      return <CoursesView />
    case "programs":
      return <ProgramsView />
    case "news":
      return <NewsView />
    case "news-article":
      return <NewsArticleView />
    case "faq":
      return <FaqView />
    case "contact":
      return <ContactView />
    case "suggestions":
      return <SuggestionsView />
    case "login":
      return <LoginView />
    case "signup":
      return <SignupView />
    case "cart":
      return <CartView />
    case "dashboard":
      return <DashboardApp />
    case "home":
    default:
      return null
  }
}
