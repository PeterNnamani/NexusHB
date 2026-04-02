"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export function CartSidebar() {
  const { items, removeFromCart, clearCart, getTotalPrice } = useCart()
  const { user, enrollCourse } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const totalPrice = getTotalPrice()

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to proceed with payment")
      router.push("/login")
      return
    }

    if (items.length === 0) {
      alert("Your cart is empty")
      return
    }

    setIsProcessing(true)

    try {
      // Initialize payment for all items in cart
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalPrice,
          email: user.email,
          courseIds: items.map((item) => item.id),
          courseNames: items.map((item) => item.title).join(", "),
          paymentMethod: "card", // Default to card for bulk checkout
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      const { checkout_url } = data.data

      // Redirect to Korapay checkout
      window.location.href = checkout_url
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : "Checkout failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full sticky top-4">
      <CardHeader>
        <CardTitle>Shopping Cart ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-primary font-semibold">₦{item.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Total */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Subtotal:</span>
            <span className="text-lg font-bold">₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button onClick={handleCheckout} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing..." : `Checkout - ₦${totalPrice.toLocaleString()}`}
          </Button>
          <Button variant="outline" onClick={clearCart} className="w-full">
            Clear Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}