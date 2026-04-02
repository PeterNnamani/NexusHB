// Example usage of the payment flow
// This is a client component that calls the server action

'use client'

import { useState } from 'react'
import { createPaymentIntent } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  courseId: string
  amount: number
  courseName?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive"
}

export function CheckoutButton({ 
  courseId, 
  amount,
  courseName,
  className,
  variant = "default"
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append("course_id", courseId)
    formData.append("amount", amount.toString())

    try {
      await createPaymentIntent(formData)
    } catch (error) {
      setIsLoading(false)
      const message = error instanceof Error ? error.message : "Payment initialization failed"
      alert(`Error: ${message}`)
      console.error("Checkout error:", error)
    }
  }

  return (
    <form onSubmit={handleCheckout} className="w-full">
      <Button
        type="submit"
        disabled={isLoading}
        variant={variant}
        className={className}
      >
        {isLoading ? 'Processing...' : `Enroll Now - ₦${amount.toLocaleString()}`}
      </Button>
    </form>
  )
}