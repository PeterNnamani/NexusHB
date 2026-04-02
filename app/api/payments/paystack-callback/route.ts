import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')

  // Use either reference or trxref (Paystack might use either)
  const paymentRef = reference || trxref

  if (!paymentRef) {
    return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 })
  }

  // Redirect to the verify page with the reference
  redirect(`/payment/verify?reference=${encodeURIComponent(paymentRef)}`)
}

export async function POST(request: NextRequest) {
  // Paystack might send POST requests as well
  const body = await request.json()
  const { reference, trxref } = body

  const paymentRef = reference || trxref

  if (!paymentRef) {
    return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 })
  }

  // Redirect to the verify page with the reference
  redirect(`/payment/verify?reference=${encodeURIComponent(paymentRef)}`)
}