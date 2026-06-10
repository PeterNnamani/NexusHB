import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { PaystackInlineHost } from '@/components/paystack-inline-host'
import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { SiteViewProvider } from '@/contexts/site-view-context'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'Nexus | Professional Web Development Learning Platform',
  description: 'Master web development with Nexus - Your comprehensive learning platform for professional web development courses, programs, and certifications.',
  keywords: ['web development', 'learning platform', 'courses', 'programming', 'Nexus'],
  authors: [{ name: 'Nexus' }],
  openGraph: {
    title: 'Nexus | Professional Web Development Learning Platform',
    description: 'Master web development with Nexus',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#052e16' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} ${inter.className} font-sans antialiased`}>
        <PaystackInlineHost />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <CartProvider>
              <SiteViewProvider>
                {children}
              </SiteViewProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
