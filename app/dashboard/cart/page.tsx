"use client"

import { useRouter } from "next/navigation"
import { CartCheckout } from "@/components/cart/cart-checkout"

export default function DashboardCartPage() {
  const router = useRouter()

  return (
    <div className="w-full">
      <CartCheckout
          onBack={() => router.push("/dashboard/browse-courses")}
          onBrowseCourses={() => router.push("/dashboard/browse-courses")}
          onCheckoutSuccess={() => router.push("/dashboard/my-courses")}
        onLoginRequired={() => router.push("/login")}
      />
    </div>
  )
}
