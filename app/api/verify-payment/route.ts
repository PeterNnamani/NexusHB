import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ success: false, message: 'Reference is required' }, { status: 400 })
  }

  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const paystackData = await paystackResponse.json()

    console.log('[verify-payment] paystackData', {
      status: paystackResponse.status,
      ok: paystackResponse.ok,
      data: paystackData,
    })

    if (!paystackResponse.ok || paystackData?.data?.status !== 'success') {
      return NextResponse.json({
        success: false,
        message: 'Payment verification failed',
        details: paystackData,
      }, { status: 400 })
    }

    // Use SERVICE ROLE KEY here so RLS doesn't block the query
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, course_id, amount, status, reference')
      .eq('reference', reference)
      .maybeSingle()

    if (orderError) {
      console.error('Database error fetching order:', orderError)
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 })
    }

    if (!order) {
      console.error('Order not found for reference:', reference)
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    console.log('✅ Order found:', order.reference, 'course_id:', order.course_id)

    // Validate course_id is not empty
    if (!order.course_id) {
      console.error('Order has no course_id')
      return NextResponse.json({
        success: false,
        message: 'Order missing course_id',
      }, { status: 400 })
    }

    const courseIds = order.course_id
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean)

    const courseIdsNumeric = courseIds
      .map((c: string) => parseInt(c.replace(/[^0-9]/g, ''), 10))
      .filter((n: number) => !Number.isNaN(n))

    // Update order to paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid', 
        paid_at: new Date().toISOString() 
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
    }

    // === UPDATE USER_COURSES TABLE (mark as paid) ===
    for (const courseId of courseIds) {
      const { error: userCourseError } = await supabase
        .from('user_courses')
        .upsert({
          user_id: order.user_id,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          paid: true,
        }, { onConflict: 'user_id,course_id' })

      if (userCourseError) {
        console.error('Failed to update user_courses:', userCourseError)
      }
    }

    // === UPDATE ENROLLMENTS TABLE ===
    for (const courseId of courseIds) {
      const { data: existingEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', order.user_id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (enrollmentError) {
        console.error('Error checking existing enrollment:', enrollmentError)
      } else if (existingEnrollment && existingEnrollment.id) {
        await supabase
          .from('enrollments')
          .update({ status: 'active', progress: 0 })
          .eq('id', existingEnrollment.id)
      } else {
        await supabase
          .from('enrollments')
          .insert({
            user_id: order.user_id,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            status: 'active',
            progress: 0,
          })
      }
    }

    // === INSERT INTO PAYMENTS TABLE ===
    for (const courseNumeric of courseIdsNumeric) {
      const { data: existingPayment, error: paymentCheckError } = await supabase
        .from('payments')
        .select('id')
        .eq('reference', order.reference)
        .eq('course_id', courseNumeric)
        .maybeSingle()

      if (paymentCheckError) {
        console.error('Error checking existing payment:', paymentCheckError)
        continue
      }

      if (!existingPayment) {
        const { error: paymentInsertError } = await supabase
          .from('payments')
          .insert({
            user_id: order.user_id,
            course_id: courseNumeric,
            amount: order.amount,
            reference: order.reference,
            status: 'success',
            payment_method: 'paystack',
            paid_at: new Date().toISOString(),
          })

        if (paymentInsertError) {
          console.error('Error inserting payments row:', paymentInsertError)
        }
      }
    }

    console.log('✅ User course, enrollments and payments records updated')

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmed and course enrolled' 
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}