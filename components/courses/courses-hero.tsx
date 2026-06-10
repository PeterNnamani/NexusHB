"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFilter } from "@/contexts/filter-context"
import { CoursesCategoryChips } from "@/components/courses/courses-category-chips"

export function CoursesHero() {
  const { searchQuery, setSearchQuery } = useFilter()

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Soft corner gradients — Known-inspired, Nexus emerald palette */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl dark:bg-emerald-500/8" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-900/15" />

      <div className="container relative z-10 mx-auto px-4 py-10 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-primary">
            Course catalog
          </span>
          <h1 className="text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
            Explore courses we think you&apos;ll love
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
            Task-based web development courses — from fundamentals to job-ready projects that pay in Naira.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for course…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-full border-border/80 bg-background/90 pl-12 pr-5 text-base shadow-sm backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="mt-8">
          <CoursesCategoryChips />
        </div>
      </div>
    </section>
  )
}
