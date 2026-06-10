import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FAQHero } from "@/components/faq/faq-hero"
import { FAQAccordion } from "@/components/faq/faq-accordion"
import { FAQContact } from "@/components/faq/faq-contact"

export const metadata = {
  title: "FAQ | Nexus",
  description: "Find answers to frequently asked questions about Nexus courses, programs, and platform features.",
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <FAQHero />
        <FAQAccordion />
        <FAQContact />
      </main>
      <Footer />
    </div>
  )
}
