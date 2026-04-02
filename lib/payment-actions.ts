'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface CreatePaymentIntentParams {
  courseId: string
  amount: number
  userId: string
  userEmail: string
}

export async function createPaymentIntent({
  courseId,
  amount,
  userId,
  userEmail,
}: CreatePaymentIntentParams) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      throw new Error('User not authenticated')
    }

    // Generate unique reference
    const reference = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

    // Create pending order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        course_id: courseId,
        reference,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Failed to create order:', orderError)
      throw new Error('Failed to create order')
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        reference,
        amount: Math.round(amount * 100), // Convert to kobo
        email: userEmail,
        callback_url: `${SITE_URL}/payment/verify`,
        metadata: {
          order_id: order.id,
          course_id: courseId,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('reference', reference)

      console.error('Paystack initialization failed:', paystackData)
      throw new Error('Failed to initialize payment')
    }

    // Log successful initialization
    console.log(`Payment initialized: ref=${reference}, user=${userId}, course=${courseId}`)

    // Return authorization URL for redirect
    return { authorizationUrl: paystackData.data.authorization_url }

  } catch (error) {
    console.error('Payment intent creation error:', error)
    throw error
  }
}

interface VerifyPaymentParams {
  reference: string
}

export async function verifyPayment({ reference }: VerifyPaymentParams) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status || paystackData.data.status !== 'success') {
      console.error('Payment verification failed:', paystackData)

      // Optionally update order to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('reference', reference)

      return { success: false, error: 'Payment verification failed' }
    }

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .maybeSingle()

    if (orderError) {
      console.error('Order lookup error:', orderError)
      return { success: false, error: 'Order not found' }
    }

    if (!order) {
      console.error('Order not found for reference:', reference)
      return { success: false, error: 'Order not found' }
    }

    if (order.status !== 'pending') {
      // Already processed - return success to avoid duplicate processing
      return { success: true, order }
    }

    // Update order to paid
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('reference', reference)

    if (updateOrderError) {
      console.error('Failed to update order:', updateOrderError)
      return { success: false, error: 'Failed to update order status' }
    }

    // Enroll user in course (upsert to handle duplicates)
    const { error: enrollError } = await supabase
      .from('user_courses')
      .upsert({
        user_id: order.user_id,
        course_id: order.course_id,
        enrolled_at: new Date().toISOString(),
        paid: true,
      }, {
        onConflict: 'user_id,course_id'
      })

    if (enrollError) {
      console.error('Failed to enroll user:', enrollError)
      // Don't fail the whole process if enrollment fails
      // The payment was successful, so we should still return success
    }

    // Log successful verification
    console.log(`Payment verified: ref=${reference}, user=${order.user_id}, course=${order.course_id}`)

    // Revalidate dashboard to show new enrollment
    revalidatePath('/dashboard')

    return { success: true, order }

  } catch (error) {
    console.error('Payment verification error:', error)
    return { success: false, error: 'Internal server error' }
  }
}