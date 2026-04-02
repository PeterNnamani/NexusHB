"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ShoppingCart, Trash2, ArrowLeft, Clock } from "lucide-react"

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
      console.warn("Dashboard cart checkout timeout: resetting processing state")
      setIsProcessing(false)
    }, 30000)

    const completeProcessing = () => {
      clearTimeout(timeoutId)
      setIsProcessing(false)
    }

    try {
      // For bulk checkout with multiple courses
      const reference = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Initialize payment with our fallback API
      const initResponse = await fetch('/api/payments/paystack-init-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalPrice,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          reference: reference,
          courseIds: items.map((item) => item.id),
          courseNames: items.map((item) => item.title).join(", "),
          userId: user.id,
          metadata: {
            isBulkCheckout: true,
            courseCount: items.length,
          },
        }),
      })

      if (!initResponse.ok) {
        const errorData = await initResponse.json()
        throw new Error(errorData.error || "Failed to initialize payment")
      }

      const initData = await initResponse.json()

      // Check if PaystackPop is available
      if (!window.PaystackPop) {
        throw new Error("Paystack is not loaded. Please refresh the page.")
      }

      // Store cart items for later enrollment
      localStorage.setItem(`checkout_${reference}`, JSON.stringify({
        courseIds: items.map((item) => item.id),
        courseNames: items.map((item) => item.title),
        userId: user.id,
        amount: totalPrice,
        reference,
      }))

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
        callback: async function (response: any) {
          console.log("Payment successful!", response)

          try {
            // Verify payment with our API
            const verifyResponse = await fetch(`/api/payments/verify?reference=${response.reference}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (!verifyResponse.ok) {
              throw new Error("Failed to verify payment")
            }

            const verifyData = await verifyResponse.json()

            if (verifyData.status === 'success') {
              // Enroll user in all courses
              if (user) {
                await Promise.all(
                  items.map((item) => enrollCourse(item.id.toString()))
                )
              }

              // Clear cart
              clearCart()

              // Show success message
              alert(`✅ Enrollment successful! You are now enrolled in ${items.length} course(s).`)

              completeProcessing()

              // Redirect to dashboard
              router.push("/dashboard/my-courses")
            } else {
              throw new Error("Payment verification failed")
            }
          } catch (error) {
            console.error("Verification error:", error)
            alert("Payment received but verification failed. Please contact support.")
            completeProcessing()
          }
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : "Checkout failed. Please try again.")
      completeProcessing()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 pb-12">
        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <Link href="/courses" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Shopping Cart</h1>
              </div>
              <p className="text-muted-foreground">
                {items.length === 0 ? "Your cart is empty" : `${items.length} course${items.length !== 1 ? "s" : ""} in your cart`}
              </p>
            </div>

            {items.length === 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="py-16 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="bg-muted p-4 rounded-full">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                      <p className="text-muted-foreground mb-6">
                        Start learning by adding courses to your cart
                      </p>
                      <Link href="/courses">
                        <Button className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Browse Courses
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="md:col-span-2 space-y-4">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4 p-6">
                        {item.image && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-2 hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          {item.instructor && (
                            <p className="text-sm text-muted-foreground mb-2">
                              By {item.instructor}
                            </p>
                          )}
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-primary">
                              ₦{item.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Cart Summary */}
                <div>
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Breakdown */}
                      <div className="space-y-2 pb-4 border-b">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">₦{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Courses</span>
                          <span className="font-medium">{items.length}</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-3xl font-bold text-primary">
                          ₦{totalPrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Checkout Button */}
                      <Button
                        onClick={handleCheckout}
                        disabled={isProcessing || items.length === 0}
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                      >
                        {isProcessing ? "Processing..." : "Proceed to Checkout"}
                      </Button>

                      {/* Continue Shopping */}
                      <Link href="/courses" className="block">
                        <Button
                          variant="outline"
                          className="w-full"
                        >
                          Continue Shopping
                        </Button>
                      </Link>

                      {/* Clear Cart */}
                      {items.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm("Clear your cart?")) {
                              clearCart()
                            }
                          }}
                          className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-2"
                        >
                          Clear cart
                        </button>
                      )}

                      {/* Security Info */}
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">✓ Secure Checkout</p>
                        <p>All payments are processed securely through Paystack.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
