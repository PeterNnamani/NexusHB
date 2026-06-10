"use client"

import { useState, useEffect } from "react"
import { SiteNavLink } from "@/components/site/site-nav-link"
import {
  ArrowRight,
  Users,
  BookOpen,
  Award,
  Sparkles,
  Code2,
  Wallet,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STAT_SURFACES } from "@/lib/category-colors"

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`
  return `${n}`
}

export function HeroSection() {
  const [stats, setStats] = useState({ students: 0, courses: 0, certificates: 0 })

  useEffect(() => {
    fetch("/api/platform-stats")
      .then((r) => r.json())
      .then((d) =>
        setStats({
          students: d.students || 0,
          courses: d.courses || 0,
          certificates: d.certificates || 0,
        }),
      )
      .catch(() => {})
  }, [])

  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_-5%,var(--primary)/0.14,transparent)]" />
      <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-emerald-400/8 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-[calc(var(--header-height)+var(--announcement-height)+2rem)] lg:pb-24 lg:pt-[calc(var(--header-height)+var(--announcement-height)+3rem)]">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Learn from quality, project-based courses
            </div>

            <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-[3.25rem]">
              The platform to{" "}
              <span className="text-primary">empower your skills</span>
            </h1>

            <p className="mb-8 max-w-md text-lg text-muted-foreground leading-relaxed">
              Guided courses, live classrooms, and paid tasks — all in one dashboard.
            </p>

            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SiteNavLink href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full rounded-full px-8 shadow-lg shadow-primary/25 sm:w-auto">
                  Start learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SiteNavLink>
              <SiteNavLink href="/courses" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full border-border/80 bg-background/60 px-8 backdrop-blur-sm sm:w-auto"
                >
                  Browse courses
                </Button>
              </SiteNavLink>
            </div>

            <p className="text-sm text-muted-foreground">
              Start your education journey — for a better future.
            </p>
          </div>

          {/* Visual */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Decorative shapes */}
            <div className="pointer-events-none absolute -left-4 top-8 h-16 w-16 rotate-12 rounded-lg bg-primary/30" />
            <div className="pointer-events-none absolute right-8 top-4 flex gap-1.5">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-primary/40" />
              ))}
            </div>
            <div className="pointer-events-none absolute -right-2 bottom-24 h-10 w-10 rounded-full border-4 border-primary/30" />

            {/* Main card */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-primary/90 via-emerald-600/85 to-teal-700/80 p-8 shadow-2xl shadow-primary/20 sm:p-10">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

              <div className="relative space-y-6 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Code2 className="h-8 w-8" />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                    Earn while you learn
                  </p>
                  <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                    Build real projects. Get paid in{" "}
                    <span className="text-earn">₦</span>.
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BookOpen, label: "Courses" },
                    { icon: Play, label: "Live classes" },
                    { icon: Wallet, label: "Paid tasks" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 px-2 py-3 backdrop-blur-sm"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-white/80">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-4 z-20 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md sm:-left-8 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[Users, Award, BookOpen].map((Icon, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-background",
                        i === 0 && "bg-primary/20 text-primary",
                        i === 1 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                        i === 2 && "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">
                    {stats.students > 0 ? formatCount(stats.students) : "Growing"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Active learners</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-20">
          {[
            {
              value: stats.students > 0 ? formatCount(stats.students) : "—",
              label: "Learners",
              surface: STAT_SURFACES.green,
            },
            {
              value: stats.courses > 0 ? formatCount(stats.courses) : "—",
              label: "Courses",
              surface: STAT_SURFACES.green,
            },
            {
              value: "₦",
              label: "Earn while learning",
              surface: STAT_SURFACES.earn,
            },
            {
              value: stats.certificates > 0 ? formatCount(stats.certificates) : "—",
              label: "Certificates",
              surface: STAT_SURFACES.neutral,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl border p-4 text-center transition-colors hover:border-primary/30 sm:p-5",
                stat.surface.card,
              )}
            >
              <p className={cn("text-2xl font-bold leading-none sm:text-3xl", stat.surface.value)}>
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
