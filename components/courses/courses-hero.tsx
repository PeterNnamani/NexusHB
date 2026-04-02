import Image from "next/image"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function CoursesHero() {
  return (
    <section className="relative py-8 lg:py-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/courses-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-20 dark:opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/50 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-2">
            150+ Courses Available
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-balance">
            Explore Courses Designed to Help You Earn
          </h1>
          <p className="text-base text-muted-foreground mb-4 text-pretty">
            From beginner fundamentals to advanced paths, find task-based courses that help you build skills and unlock real earning opportunities.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="glass-card pl-12 pr-4 h-14 rounded-full text-base"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
