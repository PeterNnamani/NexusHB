import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_683f9a84ac0a7c0d4654ff6573924bf30342abb2"

interface FallbackInitializeRequest {
  amount: number
  email: string
  reference: string
  courseId?: number
  courseIds?: number[]
  courseTitle?: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: FallbackInitializeRequest = await request.json()

    if (!body.amount || !body.email || !body.reference) {
      return NextResponse.json({ error: 'Missing required payload: amount, email, reference' }, { status: 400 })
    }

    let orderId: string | null = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const courseIdValue = body.courseIds?.length ? body.courseIds.join(',') : `${body.courseId ?? ''}`

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: body.userId ?? null,
          course_id: courseIdValue,
          reference: body.reference,
          amount: body.amount,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (orderError) {
        console.warn('Fallback order insert failed; continuing anyway', orderError)
      }
      orderId = order?.id || null
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(body.amount * 100),
        email: body.email,
        reference: body.reference,
        metadata: {
          courseId: body.courseId,
          courseIds: body.courseIds,
          courseTitle: body.courseTitle,
          userId: body.userId,
        },
        callback_url: process.env.PAYSTACK_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/webhook`,
      }),
    })

    const data = await paystackResponse.json()

    if (!paystackResponse.ok) {
      if (orderId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        await supabase.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', body.reference)
      }
      return NextResponse.json({ error: 'Paystack initialization failed', details: data }, { status: paystackResponse.status })
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
      orderId,
    })
  } catch (error) {
    console.error('paystack-init-fallback error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
