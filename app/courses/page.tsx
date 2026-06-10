import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CoursesHero } from "@/components/courses/courses-hero"
import { CoursesGrid } from "@/components/courses/courses-grid-new"
import { FilterProvider } from "@/contexts/filter-context"

export const metadata = {
  title: "Courses | Nexus Learning Platform",
  description: "Browse our comprehensive collection of web development courses designed to take you from beginner to professional.",
}

export default function CoursesPage() {
  return (
    <FilterProvider>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 pt-header">
          <CoursesHero />
          <section className="py-8 lg:py-12">
            <div className="container mx-auto px-4">
              <CoursesGrid />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </FilterProvider>
  )
}
