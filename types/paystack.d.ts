interface PaystackPopSetupOptions {
  key: string
  email: string
  amount: number
  currency?: string
  ref: string
  onClose?: () => void
  callback?: (response: { reference: string }) => void
}

interface PaystackPopHandler {
  openIframe: () => void
}

interface PaystackPopStatic {
  setup: (options: PaystackPopSetupOptions) => PaystackPopHandler
}

interface Window {
  PaystackPop?: PaystackPopStatic
}
