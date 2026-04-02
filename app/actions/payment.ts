"use server";

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 1. CREATE PAYMENT INTENT (called when user clicks "Pay Now")
 * Inserts order into database with public.users(id) reference (no auth.users dependency)
 */
export async function createPaymentIntent(formData: FormData) {
  const supabase = createServerClient();

  // Get the currently logged-in user (Supabase Auth)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to make a payment");
  }

  const course_id = formData.get("course_id") as string;
  const amount = Number(formData.get("amount"));

  if (!course_id || !amount || amount <= 0) {
    throw new Error("Invalid course or amount");
  }

  // Generate unique reference
  const reference = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  console.log("Creating order for user:", user.id, "reference:", reference);

  // INSERT INTO orders — user_id must exist in public.users
  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,           // ← must match a row in public.users
      course_id,
      reference,
      amount,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !order) {
    console.error("Insert failed:", insertError);
    throw new Error("Failed to create order. Please try again.");
  }

  console.log("Order created successfully:", order.id);

  // Build authorization URL for Paystack
  const paystackUrl = new URL("https://checkout.paystack.com/api/standard");
  paystackUrl.searchParams.set("key", process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "");
  paystackUrl.searchParams.set("email", user.email || "customer@email.com");
  paystackUrl.searchParams.set("amount", String(amount * 100)); // Convert to kobo
  paystackUrl.searchParams.set("ref", reference);
  paystackUrl.searchParams.set("onClose", `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`);
  paystackUrl.searchParams.set("callback", `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/paystack-callback`);

  // Redirect user to Paystack checkout
  redirect(paystackUrl.toString());
}

/**
 * 2. VERIFY PAYMENT (called on /payment/verify?reference=...)
 * Checks with Paystack (source of truth), then updates DB and enrolls user
 */
export async function verifyPayment(reference: string) {
  const supabase = createServerClient();

  if (!reference) {
    return { success: false, error: "Missing reference" };
  }

  console.log("Verifying payment for reference:", reference);

  try {
    // 1. Verify with Paystack (source of truth)
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await res.json();

    if (!res.ok || paystackData.status !== true || paystackData.data.status !== "success") {
      console.warn("Paystack verification failed:", paystackData.message);
      
      // Mark order as failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("reference", reference)
        .catch(err => console.error("Failed to mark order as failed:", err));

      return { success: false, error: paystackData.message || "Payment not successful" };
    }

    // 2. Payment confirmed → find and update order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, course_id")
      .eq("reference", reference)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching order:", fetchError);
      return { success: false, error: "Error retrieving order information" };
    }

    if (!order) {
      console.error("Order not found for reference:", reference);
      return { success: false, error: "Order not found" };
    }

    // 3. Update order status to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }

    // 4. Enroll user in course
    const { error: enrollError } = await supabase
      .from("user_courses")
      .upsert(
        {
          user_id: order.user_id,
          course_id: order.course_id,
          enrolled_at: new Date().toISOString(),
          paid: true,
        },
        { onConflict: "user_id,course_id" }
      );

    if (enrollError) {
      console.error("Error enrolling user:", enrollError);
      // Don't fail the payment if enrollment fails - user can manually enroll
      console.warn("User will need manual enrollment for course:", order.course_id);
    }

    console.log("✅ Payment verified and processed successfully!");

    return { 
      success: true, 
      courseId: order.course_id,
      orderId: order.id 
    };
  } catch (error) {
    console.error("Verification error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
