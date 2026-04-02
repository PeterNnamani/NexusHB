"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, X } from "lucide-react"

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
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
      console.warn("Cart modal checkout timeout: resetting processing state")
      setIsProcessing(false)
    }, 30000)

    const completeProcessing = () => {
      clearTimeout(timeoutId)
      setIsProcessing(false)
    }

    try {
      // For bulk checkout with multiple courses
      const reference = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Initialize payment with our API
      const initResponse = await fetch('/api/payments/paystack-init', {
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

      // Close the modal before opening Paystack
      onClose()

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 -mx-6 px-6 border-b">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">
              Shopping Cart {items.length > 0 && `(${items.length})`}
            </DialogTitle>
          </div>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-muted p-4 rounded-full">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Start learning by adding courses to your cart</p>
            <Button onClick={onClose} className="gap-2">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  {item.image && (
                    <div className="relative w-20 h-20 rounded overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-2 mb-1">{item.title}</h4>
                    {item.instructor && (
                      <p className="text-sm text-muted-foreground">By {item.instructor}</p>
                    )}
                    <p className="text-lg font-bold text-primary mt-2">₦{item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} course{items.length !== 1 ? "s" : ""})</span>
                <span className="font-medium">₦{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₦{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 sticky bottom-0 bg-background pt-4 -mx-6 px-6 pb-6 border-t">
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full h-11 bg-primary hover:bg-primary/90"
              >
                {isProcessing ? "Processing..." : "Proceed to Checkout"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-10"
                >
                  Continue Shopping
                </Button>
                {items.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm("Clear your cart?")) {
                        clearCart()
                      }
                    }}
                    className="h-10 text-destructive"
                  >
                    Clear Cart
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                <span>Secure payments powered by</span>
                <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2L8 8H2L6.5 12L4.5 18H10L15.5 12L13.5 6H7L10 2Z" fill="currentColor"/>
                  <text x="18" y="15" fontSize="12" fontWeight="bold" fill="currentColor">Paystack</text>
                </svg>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
