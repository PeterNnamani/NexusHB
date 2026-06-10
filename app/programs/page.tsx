import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProgramsHero } from "@/components/programs/programs-hero"
import { ProgramsGrid } from "@/components/programs/programs-grid"
import { ProgramsCTA } from "@/components/programs/programs-cta"

export const metadata = {
  title: "Programs | Nexus Learning Platform",
  description: "Comprehensive learning programs designed to transform you into a professional developer with structured curriculum and career support.",
}

export default function ProgramsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-header">
        <ProgramsHero />
        <ProgramsGrid />
        <ProgramsCTA />
      </main>
      <Footer />
    </div>
  )
}
