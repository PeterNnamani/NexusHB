"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SuggestionsForm } from "@/components/suggestions/suggestions-form"

export default function SuggestionsView() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto">
              <SuggestionsForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
