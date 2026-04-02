import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { NewsHero } from "@/components/news/news-hero"
import { NewsGrid } from "@/components/news/news-grid"

export const metadata = {
  title: "News | Nexus",
  description: "Stay up to date with the latest news, announcements, and updates from the Nexus learning platform.",
}

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20">
        <NewsHero />
        <NewsGrid />
      </main>
      <Footer />
    </div>
  )
}
