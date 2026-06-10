import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SuggestionsForm } from "@/components/suggestions/suggestions-form"

export const metadata = {
  title: "Suggestions | Nexus",
  description: "Share your ideas and suggestions to help us improve the Nexus learning platform.",
}

export default function SuggestionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <section className="relative py-16 lg:py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
                  We Value Your Input
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                  Share Your Suggestions
                </h1>
                <p className="text-lg text-muted-foreground text-pretty">
                  Help us make Nexus better! Your feedback and ideas are crucial 
                  in shaping the future of our platform.
                </p>
              </div>

              <SuggestionsForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
