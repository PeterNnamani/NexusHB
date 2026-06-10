"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, BookOpen, ShoppingCart } from "lucide-react"
import { initializePaystackPayment } from "@/lib/init-paystack-payment"
import { openPaystackCheckout } from "@/lib/paystack-checkout"
import { resolveCheckoutEmail } from "@/lib/checkout-client"
import { verifyPaymentWithRetry } from "@/lib/verify-payment-client"

interface CourseModule {
  id: string
  title: string
  duration: string
  completed?: boolean
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: string
    title: string
    price: number
    description?: string
    duration?: string
    instructor?: string
    rating?: number
    reviews?: number
    category?: string
    level?: string
    students?: number
    image?: string
    syllabus?: CourseModule[]
  }
  onSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, course, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddedMessage, setShowAddedMessage] = useState(false)
  const { user, enrollCourse, refreshUser } = useAuth()
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    if (!user) {
      alert("Please login to add courses to cart")
      return
    }

    addToCart({
      id: course.id,
      title: course.title,
      price: course.price,
      thumbnail: course.image,
    })

    setShowAddedMessage(true)
    setTimeout(() => {
      setShowAddedMessage(false)
      onClose()
    }, 2000)
  }

  const handleEnrollNow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      alert("Please login to enroll in this course")
      return
    }

    setIsProcessing(true)

    try {
      if (course.price <= 0) {
        await enrollCourse(course.id.toString())
        onSuccess()
        onClose()
        return
      }

      const checkoutEmail = await resolveCheckoutEmail(user.email)
      const init = await initializePaystackPayment({
        amount: course.price,
        email: checkoutEmail,
        name: user.name || checkoutEmail.split("@")[0],
        courseIds: [course.id.toString()],
        courseNames: course.title,
        userId: user.id,
      })

      if (!init.success || !init.reference) {
        throw new Error(init.error || "Payment initialization failed")
      }

      await openPaystackCheckout({
        email: checkoutEmail,
        amount: course.price,
        reference: init.reference,
        authorizationUrl: init.authorizationUrl,
        onClose: () => setIsProcessing(false),
        onSuccess: async (paidRef) => {
          const verifyData = await verifyPaymentWithRetry(paidRef)
          if (!verifyData.success) {
            throw new Error(verifyData.message || "Payment verification failed")
          }
          await refreshUser()
          onSuccess()
          onClose()
          setIsProcessing(false)
        },
      })
    } catch (error) {
      setIsProcessing(false)
      const message = error instanceof Error ? error.message : "Payment initialization failed"
      alert(`Error: ${message}`)
      console.error("Payment error:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Enroll in Course</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Course Header - Compact */}
          {course.image && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              {course.category && (
                <Badge className="absolute top-2 left-2 text-xs">{course.category}</Badge>
              )}
              {course.level && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{course.level}</Badge>
              )}
            </div>
          )}

          {/* Course Info - Compact */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold line-clamp-2">{course.title}</h2>
            {course.instructor && (
              <p className="text-xs text-muted-foreground">By {course.instructor}</p>
            )}
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              {course.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.rating}</span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.students && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span>{course.students.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price - Large & Prominent */}
          <div className="bg-linear-to-r from-primary/20 to-primary/10 p-3 rounded-lg border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Total Price</p>
            <p className="text-3xl font-bold text-primary">
              ₦{course.price.toLocaleString()}
            </p>
          </div>

          {/* Description - Short */}
          {course.description && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            </div>
          )}

          {/* Mini Syllabus - Just titles */}
          {course.syllabus && course.syllabus.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {course.syllabus.length} Modules
              </h3>
              <div className="grid gap-1">
                {course.syllabus.slice(0, 3).map((module) => (
                  <div key={module.id} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                    <p className="font-medium line-clamp-1">{module.title}</p>
                    <span className="text-muted-foreground ml-2">{module.duration}</span>
                  </div>
                ))}
                {course.syllabus.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{course.syllabus.length - 3} more modules
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t">
            {showAddedMessage && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center text-sm text-green-600 font-medium">
                ✓ Added to cart! Redirecting...
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="flex-1 h-10 text-sm gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
              <form onSubmit={handleEnrollNow} className="flex-1">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-10 text-sm bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? "Loading..." : "Enroll Now"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
