"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FAQHero } from "@/components/faq/faq-hero"
import { FAQAccordion } from "@/components/faq/faq-accordion"
import { FAQContact } from "@/components/faq/faq-contact"

export default function FaqView() {
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
