import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function FAQHero() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Help Center
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Find answers to common questions about our courses, programs, 
            certifications, and platform features.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions..."
              className="glass-card pl-12 pr-4 h-14 rounded-full text-base"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
