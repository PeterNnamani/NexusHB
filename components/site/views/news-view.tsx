"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { NewsHero } from "@/components/news/news-hero"
import { NewsGridClient } from "@/components/site/news-grid-client"

export default function NewsView() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <NewsHero />
        <NewsGridClient />
      </main>
      <Footer />
    </div>
  )
}
