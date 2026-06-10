"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CartCheckout } from "@/components/cart/cart-checkout"
import { useSiteView } from "@/contexts/site-view-context"

export default function CartPage() {
  const { navigate } = useSiteView()

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <CartCheckout
            onBack={() => navigate("courses")}
            onBrowseCourses={() => navigate("courses")}
            onCheckoutSuccess={() => {
              sessionStorage.setItem("nexus_pending_dashboard_path", "/dashboard/my-courses")
              navigate("dashboard")
            }}
            onLoginRequired={() => navigate("login")}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
