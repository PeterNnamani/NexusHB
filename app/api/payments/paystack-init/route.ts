import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Paystack test keys (from environment)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_683f9a84ac0a7c0d4654ff6573924bf30342abb2"

interface InitializePaymentRequest {
  amount: number
  email: string
  name: string
  reference: string
  courseId?: number
  courseTitle?: string
  courseIds?: number[]
  userId: string
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: InitializePaymentRequest = await request.json()
    console.log('paystack-init payload', body)

    // Validate required fields for consistent flow
    if (!body.amount || !body.reference || !body.userId || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, reference, userId, email' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required Supabase env vars')
      return NextResponse.json({ error: 'Supabase service role key is not configured' }, { status: 500 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Normalize and resolve user
    const resolvedUserId = body.userId.trim() || body.email.trim()
    await supabase.from('users').upsert({
      id: resolvedUserId,
      email: body.email,
      name: body.name || body.email.split('@')[0] || 'Unknown User',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    const courseIdValue = body.courseIds?.length ? body.courseIds.join(',') : (body.courseId ? String(body.courseId) : null)

    if (!courseIdValue) {
      return NextResponse.json(
        { error: 'No course ID provided' },
        { status: 400 }
      )
    }

    console.log('creating pending order for user', resolvedUserId, 'ref', body.reference, 'course_id:', courseIdValue)

    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      user_id: resolvedUserId,
      course_id: courseIdValue,
      reference: body.reference,
      amount: body.amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single()

    if (orderError || !orderData) {
      console.error('Order insert failed', orderError, { userId: resolvedUserId, body })
      return NextResponse.json({ error: 'Failed to create order', details: orderError }, { status: 500 })
    }

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(body.amount * 100), // Convert to kobo (Paystack requires integer in kobo)
        email: body.email,
        reference: body.reference,
        metadata: {
          courseId: body.courseId,
          userId: body.userId,
          courseTitle: body.courseTitle,
          courseIds: body.courseIds,
          name: body.name,
          ...body.metadata,
        },
        callback_url: process.env.PAYSTACK_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/paystack-webhook`,
      }),
    })

    const data = await paystackResponse.json()

    if (!paystackResponse.ok) {
      // mark order as failed for the report flow
      await supabase.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', body.reference)
      console.error('Paystack initialization error:', data)
      return NextResponse.json(
        { error: 'Failed to initialize payment', details: data },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
