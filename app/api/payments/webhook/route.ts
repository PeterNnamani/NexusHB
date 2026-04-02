import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_683f9a84ac0a7c0d4654ff6573924bf30342abb2"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('x-paystack-signature')

    // Verify webhook signature from Paystack
    if (signature && PAYSTACK_SECRET_KEY) {
      const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex')

      if (hash !== signature) {
        console.warn('Webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    console.log('Webhook received:', event)

    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data

      // Extract course ID from metadata
      const courseId = metadata?.courseId
      const userId = metadata?.userId
      const courseTitle = metadata?.courseTitle

      if (courseId && userId) {
        console.log(`Payment successful for course:`, {
          reference,
          amount: amount / 100, // Convert from kobo
          courseId,
          userId,
          courseTitle,
        })

        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
          await supabase.from('orders').update({
            status: 'success',
            updated_at: new Date().toISOString(),
          }).eq('reference', reference)
        }

        // In production, you would update the database here to record the enrollment
        // For now, the enrollment is handled client-side after payment verification

        return NextResponse.json({ 
          status: 'ok',
          message: 'Payment verified. User will be enrolled.',
          courseId,
          reference,
          metadata
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}