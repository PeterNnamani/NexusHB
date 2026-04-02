"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, enrollCourse } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [courseId, setCourseId] = useState<number | null>(null)
  const [courseTitle, setCourseTitle] = useState<string>("")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get("reference")

        if (!reference) {
          // Check localStorage for stored enrollment data
          const storedCourseData = localStorage.getItem("pendingEnrollment")
          if (storedCourseData) {
            const { courseId, courseTitle } = JSON.parse(storedCourseData)
            setCourseId(courseId)
            setCourseTitle(courseTitle)

            // Enroll user in the course
            if (user) {
              enrollCourse(courseId)
              localStorage.removeItem("pendingEnrollment")
              setStatus("success")
              return
            }
          }

          setMessage("No payment reference found")
          setStatus("error")
          return
        }

        // Verify payment with our API
        const response = await fetch(`/api/payments/success?reference=${reference}`)
        const data = await response.json()

        if (data.success && data.status === "success") {
          const { courseId: cId, amount, customerEmail } = data.data

          setCourseId(parseInt(cId))
          setMessage(`Payment of ₦${amount.toLocaleString()} confirmed!`)

          // Enroll user in the course
          if (user && cId) {
            enrollCourse(parseInt(cId))
            setStatus("success")

            // Clear any pending enrollment data
            localStorage.removeItem("pendingEnrollment")
          } else if (!user) {
            setMessage("Please log in to complete enrollment")
            setStatus("error")
          }
        } else if (data.status === "pending") {
          setMessage("Payment is still being processed. Please wait...")
          setStatus("loading")

          // Retry after 5 seconds
          setTimeout(() => {
            window.location.reload()
          }, 5000)
        } else {
          setMessage(data.message || "Payment verification failed")
          setStatus("error")
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setMessage("Error verifying payment. Please contact support.")
        setStatus("error")
      }
    }

    verifyPayment()
  }, [searchParams, user, enrollCourse])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8">
        {status === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Processing Payment</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your payment and enroll you in the course...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Enrollment Successful!</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm font-medium mb-1">Course Enrolled</p>
              <p className="text-lg font-semibold">{courseTitle || "Course"}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You now have full access to this course! Start learning right away.
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard/my-courses">
                  Go to My Courses
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/courses">
                  Browse More Courses
                </Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Issue</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you've been charged, please contact our support team for assistance.
              </p>
              <Button asChild className="w-full">
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/courses">
                  Return to Courses
                </Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
