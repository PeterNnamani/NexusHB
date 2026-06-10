"use client"

export interface PaystackCheckoutOptions {
  email: string
  amount: number
  reference: string
  authorizationUrl?: string
  onSuccess: (reference: string) => void | Promise<void>
  onClose?: () => void
}

const PAYSTACK_FORM_ID = "nexus-paystack-inline-form"
const PAYSTACK_SCRIPT_SRC = "https://js.paystack.co/v1/inline.js"

let paystackLoadPromise: Promise<void> | null = null

function getPaystackForm(): HTMLFormElement {
  let form = document.getElementById(PAYSTACK_FORM_ID) as HTMLFormElement | null
  if (!form) {
    form = document.createElement("form")
    form.id = PAYSTACK_FORM_ID
    form.setAttribute("aria-hidden", "true")
    form.className = "hidden"
    document.body.appendChild(form)
  }
  return form
}

function resetPaystackLoader() {
  paystackLoadPromise = null
  delete window.PaystackPop
}

function removeMisplacedPaystackScripts() {
  document
    .querySelectorAll<HTMLScriptElement>(`script[src*="${PAYSTACK_SCRIPT_SRC}"]`)
    .forEach((script) => {
      if (script.parentElement?.id !== PAYSTACK_FORM_ID) {
        script.remove()
        resetPaystackLoader()
      }
    })
}

/** Ensure Paystack inline.js is loaded inside a form before opening the modal. */
export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  removeMisplacedPaystackScripts()

  if (window.PaystackPop) {
    return Promise.resolve()
  }

  if (paystackLoadPromise) {
    return paystackLoadPromise
  }

  const form = getPaystackForm()

  paystackLoadPromise = new Promise((resolve, reject) => {
    const existing = form.querySelector<HTMLScriptElement>(
      `script[src*="${PAYSTACK_SCRIPT_SRC}"]`,
    )

    if (existing) {
      if (window.PaystackPop) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => {
          resetPaystackLoader()
          reject(new Error("Failed to load Paystack"))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement("script")
    script.src = PAYSTACK_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      resetPaystackLoader()
      reject(new Error("Failed to load Paystack checkout"))
    }
    form.appendChild(script)
  })

  return paystackLoadPromise
}

function redirectToHostedCheckout(authorizationUrl: string) {
  window.location.href = authorizationUrl
}

/** Open Paystack modal, or redirect to hosted checkout if the script is unavailable. */
export async function openPaystackCheckout(options: PaystackCheckoutOptions) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim()
  if (!publicKey) {
    throw new Error(
      "Paystack is not configured. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env.local",
    )
  }

  try {
    await loadPaystackInline()
  } catch (error) {
    if (options.authorizationUrl) {
      redirectToHostedCheckout(options.authorizationUrl)
      return
    }
    throw error
  }

  if (!window.PaystackPop) {
    if (options.authorizationUrl) {
      redirectToHostedCheckout(options.authorizationUrl)
      return
    }
    throw new Error("Paystack checkout could not be loaded. Refresh and try again.")
  }

  let paymentCompleted = false

  try {
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: options.email,
      amount: Math.round(options.amount * 100),
      currency: "NGN",
      ref: options.reference,
      onClose: () => {
        if (!paymentCompleted) {
          options.onClose?.()
        }
      },
      callback: (response: { reference: string }) => {
        paymentCompleted = true
        void options.onSuccess(response.reference)
      },
    })

    handler.openIframe()
  } catch (error) {
    console.error("Paystack inline checkout failed:", error)
    if (options.authorizationUrl) {
      redirectToHostedCheckout(options.authorizationUrl)
      return
    }
    throw error instanceof Error
      ? error
      : new Error("Paystack checkout failed. Please try again.")
  }
}
