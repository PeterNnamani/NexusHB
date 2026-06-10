"use client"

import { ArrowRight, GraduationCap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteNavLink } from "@/components/site/site-nav-link"

export function DualCtaSection() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* For learners */}
          <div className="nexus-blob-card relative overflow-hidden rounded-3xl border border-border/70 bg-accent/50 p-8 lg:p-10">
            <div className="nexus-dots absolute -right-6 top-6 h-24 w-24 opacity-30" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold sm:text-2xl">For learners</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed sm:text-base">
                Enroll in project-based courses, join live classrooms, and earn in Naira as you build real skills.
              </p>
              <SiteNavLink href="/courses">
                <Button className="rounded-full px-6 shadow-md shadow-primary/20">
                  Find your course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SiteNavLink>
            </div>
          </div>

          {/* For tutors */}
          <div className="nexus-blob-card relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 p-8 lg:p-10">
            <div className="nexus-dots absolute -left-4 bottom-4 h-28 w-28 opacity-25" />
            <div className="relative z-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold sm:text-2xl">For tutors & creators</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed sm:text-base">
                Publish courses, host live sessions, and grow your audience on Nigeria&apos;s practical learning platform.
              </p>
              <SiteNavLink href="/signup">
                <Button variant="outline" className="rounded-full border-foreground/20 bg-background/60 px-6 backdrop-blur-sm">
                  Become a tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SiteNavLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
