'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PaystackCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  useEffect(() => {
    if (reference) {
      // Redirect to verify page
      router.push(`/payment/verify?reference=${encodeURIComponent(reference)}`)
    } else {
      // Redirect to dashboard if no reference
      router.push('/dashboard')
    }
  }, [reference, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Processing your payment...</p>
      </div>
    </div>
  )
}

export default function PaystackCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    }>
      <PaystackCallbackContent />
    </Suspense>
  )
}
