import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CoursesHero } from "@/components/courses/courses-hero"
import { CoursesGrid } from "@/components/courses/courses-grid-new"
import { CoursesFilter } from "@/components/courses/courses-filter"
import { FilterProvider } from "@/contexts/filter-context"

export const metadata = {
  title: "Courses | Nexus Learning Platform",
  description: "Browse our comprehensive collection of web development courses designed to take you from beginner to professional.",
}

export default function CoursesPage() {
  return (
    <FilterProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 pt-20">
          <CoursesHero />
          <section className="py-6 lg:py-10">
            <div className="container mx-auto px-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <aside className="lg:w-64 shrink-0">
                  <CoursesFilter />
                </aside>
                <div className="flex-1">
                  <CoursesGrid />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </FilterProvider>
  )
}
