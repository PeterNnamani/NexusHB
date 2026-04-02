import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_683f9a84ac0a7c0d4654ff6573924bf30342abb2"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference parameter is required' },
        { status: 400 }
      )
    }

    // Verify payment status with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack verification error:', data)
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: data.data.status,
      amount: data.data.amount / 100,
      reference: data.data.reference,
      metadata: data.data.metadata,
      transactionId: data.data.id,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}