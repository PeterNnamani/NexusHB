import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { verifyAndFulfill } from '@/lib/payment-fulfillment'
import { createClient as createServerClient } from '@/lib/supabase-server'

async function VerifyPaymentContent({
  reference,
  type,
}: {
  reference: string
  type?: string
}) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/?view=login&next=${encodeURIComponent(`/payment/verify?reference=${reference}`)}`)
    }

    const result = await verifyAndFulfill(reference, { expectedUserId: user.id })

    if (result.success) {
      if (result.type === 'subscription' || type === 'subscription') {
        redirect('/dashboard/upgrade?subscribed=true')
      }
      redirect('/dashboard/my-courses?enrolled=true')
    }

    // Show error message
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600">Payment Verification Failed</h1>
          <p className="text-muted-foreground">{result.message || 'Your payment could not be verified. Please try again or contact support.'}</p>
          <div className="space-y-2">
            <p className="text-sm">Reference: <code className="bg-muted px-2 py-1 rounded">{reference}</code></p>
          </div>
          <div className="flex gap-2 justify-center pt-4">
            <Link href="/cart">
              <Button variant="outline">Back to Cart</Button>
            </Link>
            <Link href="/contact">
              <Button>Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Verification error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-yellow-600">Verification Error</h1>
          <p className="text-muted-foreground">There was an error verifying your payment. Please try again or contact support.</p>
          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Verifying Payment</h1>
        <p className="text-muted-foreground">Please wait while we verify your payment...</p>
      </div>
    </div>
  )
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; type?: string }>
}) {
  const params = await searchParams
  const reference = params.reference
  const type = params.type

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600">Invalid Request</h1>
          <p className="text-muted-foreground">Payment reference is missing. Please try again.</p>
          <Link href="/cart">
            <Button>Return to Cart</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <VerifyPaymentContent reference={reference} type={type} />
}