"use client"

/**
 * Paystack inline.js must live inside a <form> or it throws on load.
 * Hidden host mounted once for checkout pages.
 */
export function PaystackInlineHost() {
  return (
    <form
      id="nexus-paystack-inline-form"
      aria-hidden="true"
      className="hidden"
      suppressHydrationWarning
    />
  )
}
