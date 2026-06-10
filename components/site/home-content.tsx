import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AnnouncementBar } from "@/components/landing/announcement-bar"
import { HeroSection } from "@/components/landing/hero-section"
import { CategoriesSection } from "@/components/landing/categories-section"
import { DualCtaSection } from "@/components/landing/dual-cta-section"
import { HowItWorksSection } from "@/components/landing/how-it-works"
import { CoursesPreview } from "@/components/landing/courses-preview"
import { TestimonialsSection } from "@/components/landing/testimonials-section"

/** Server-rendered homepage sections (keeps async NewsSection, etc.). */
export function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Navigation className="top-[var(--announcement-height)]" />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <DualCtaSection />
        <CoursesPreview />
        <HowItWorksSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
