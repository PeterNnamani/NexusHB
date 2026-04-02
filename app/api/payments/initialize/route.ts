import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, email, courseId, courseIds, courseTitle, courseNames, paymentMethod, userId } = await request.json()

    if (!amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Support both single course and multiple courses (bulk checkout)
    const isBulkCheckout = Array.isArray(courseIds) && courseIds.length > 0
    const reference = isBulkCheckout 
      ? `bulk_${Date.now()}`
      : `course_${courseId}_${Date.now()}`

    const korapaySecretKey = process.env.KORAPAY_SECRET_KEY
    if (!korapaySecretKey) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Initialize payment with Korapay
    const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${korapaySecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount, // Convert to kobo (NGN smallest unit)
        currency: 'NGN',
        email,
        reference,
        narration: isBulkCheckout 
          ? `Payment for ${courseNames}`
          : `Payment for ${courseTitle}`,
        channels: paymentMethod === 'card' ? ['card'] :
                 paymentMethod === 'bank' ? ['bank_transfer'] :
                 paymentMethod === 'ussd' ? ['ussd'] : ['card', 'bank_transfer', 'ussd'],
        default_channel: paymentMethod || 'card',
        customer: {
          email,
          name: email.split('@')[0],
        },
        notification_url: `${appUrl}/api/payments/webhook`,
        redirect_url: `${appUrl}/dashboard/payment-success?reference=${reference}`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Korapay API error:', data)
      return NextResponse.json(
        { error: 'Payment initialization failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}