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
        { 
          success: false,
          error: 'Payment verification failed',
          status: 'failed'
        },
        { status: 400 }
      )
    }

    const paymentStatus = data.data.status
    const courseId = data.data.metadata?.courseId
    const userId = data.data.metadata?.userId
    const courseTitle = data.data.metadata?.courseTitle
    const amount = data.data.amount / 100 // Convert from kobo
    const customerEmail = data.data.customer?.email || data.data.authorization?.user_email

    if (paymentStatus === 'success') {
      return NextResponse.json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          reference,
          courseId,
          amount,
          customerEmail,
          paymentStatus,
        }
      })
    } else if (paymentStatus === 'pending') {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'Payment is still pending',
        data: {
          reference,
          courseId,
          paymentStatus,
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Payment was not successful',
        data: {
          reference,
          courseId,
          paymentStatus,
        }
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment success verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
