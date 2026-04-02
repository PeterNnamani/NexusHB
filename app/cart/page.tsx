"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function CartPage() {
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
    const timeoutId = window.setTimeout(() => {
      console.warn("Checkout timeout: resetting processing state")
      setIsProcessing(false)
    }, 30000)

    const completeProcessing = () => {
      clearTimeout(timeoutId)
      setIsProcessing(false)
    }

    try {
      // For bulk checkout with multiple courses
      const reference = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Initialize payment on backend and create pending order using fallback route.
      const initResponse = await fetch('/api/payments/paystack-init-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          reference,
          courseIds: items.map((item) => item.id),
          courseNames: items.map((item) => item.title),
          userId: user.id,
          metadata: {
            isBulkCheckout: true,
            courseCount: items.length,
          },
        }),
      })

      if (!initResponse.ok) {
        const textBody = await initResponse.text().catch(() => '')
        let parsedBody: any = null
        try { parsedBody = textBody ? JSON.parse(textBody) : null } catch (err) { parsedBody = textBody }
        console.error('Failed to initialize payment (backend):', {
          status: initResponse.status,
          statusText: initResponse.statusText,
          body: parsedBody,
          raw: textBody,
        })
        throw new Error('Failed to initialize payment via backend')
      }

      const initData = await initResponse.json()

      // Check if PaystackPop is available
      if (!window.PaystackPop) {
        throw new Error("Paystack is not loaded. Please refresh the page.")
      }

      // Initialize Paystack modal
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_da022b0d2f8abfb3cbf9f417eaa6e965a9380d79",
        email: user.email,
        amount: totalPrice * 100, // Convert to kobo
        currency: "NGN",
        ref: reference,
        onClose: function () {
          console.log("Payment window closed.")
          setIsProcessing(false)
        },
        callback: function (response: any) {
          handlePaymentCallback(response, completeProcessing)
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : "Checkout failed. Please try again.")
      completeProcessing()
    }
  }

  const handlePaymentCallback = async (response: any, completeProcessing: () => void) => {
    console.log("Payment successful!", response)

    try {
      // Verify payment with our API
      const verifyResponse = await fetch(`/api/verify-payment?reference=${response.reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text()
        console.error('verify-payment response error:', verifyResponse.status, errorText)
        throw new Error(`Failed to verify payment (status ${verifyResponse.status})${errorText ? `: ${errorText}` : ''}`)
      }

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        // Enroll user in all courses
        if (user) {
          await Promise.all(
            items.map((item) => enrollCourse(item.id.toString()))
          )
        }

        // Clear cart
        clearCart()

        completeProcessing()
        // Show success message
        alert(`✅ Enrollment successful! You are now enrolled in ${items.length} course(s).`)
        router.push("/dashboard/my-courses")
      } else {
        throw new Error(verifyData.message || "Payment verification failed")
      }
    } catch (error) {
      console.error("Verification error:", error)
      alert("Payment received but verification failed. Please contact support.")
      completeProcessing()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 shadow-sm">
        <div className="mx-auto px-2 sm:px-4 py-1 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1 hover:bg-muted rounded-lg transition-colors group shrink-0"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <div className="text-left">
              <h1 className="text-2xl font-bold leading-tight">Shopping Cart</h1>
              <p className="text-muted-foreground text-xs">{items.length} course{items.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-2 sm:px-4 py-12">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-muted p-6 rounded-full">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 text-lg">Start learning by adding courses to your cart</p>
            <Button onClick={() => router.push("/courses")} className="gap-2">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items Grid */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your Courses</h2>
                  <span className="text-muted-foreground">({items.length} items)</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Course Image */}
                      {item.image && (
                        <div className="relative w-full h-40 overflow-hidden bg-muted">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Course Info */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          {item.instructor && (
                            <p className="text-sm text-muted-foreground">By {item.instructor}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <p className="text-lg font-bold text-primary">₦{item.price.toLocaleString()}</p>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove "${item.title}" from cart?`)) {
                                removeFromCart(item.id)
                              }
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-xl p-6 sticky top-28 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
                  <p className="text-sm text-muted-foreground">Review your courses before checkout</p>
                </div>

                {/* Summary Details */}
                <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₦{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Courses</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax/VAT</span>
                    <span className="font-medium">₦0</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Course preview</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <img
                          key={item.id}
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-12 rounded-xl object-cover border border-border"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-y py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-3xl font-bold text-primary">₦{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="rounded-3xl bg-primary/5 p-4 text-sm text-foreground border border-primary/10">
                  💰 Complete this course and unlock earning opportunities
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isProcessing ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/courses")}
                    className="w-full h-11"
                  >
                    Continue Shopping
                  </Button>
                  {items.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.confirm("Clear your entire cart?")) {
                          clearCart()
                        }
                      }}
                      className="w-full h-11 text-destructive hover:text-destructive"
                    >
                      Remove All
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">🔒 Secure Payment via Paystack</p>
                  <p className="flex items-center gap-2">💳 Supports Card, Bank Transfer, USSD</p>
                  <p className="flex items-center gap-2">✅ 7-day refund guarantee</p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2 flex-wrap">
                    <span>Secure payments powered by</span>
                    <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2L8 8H2L6.5 12L4.5 18H10L15.5 12L13.5 6H7L10 2Z" fill="currentColor"/>
                      <text x="18" y="15" fontSize="12" fontWeight="bold" fill="currentColor">Paystack</text>
                    </svg>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
