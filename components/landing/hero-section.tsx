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
            <div
              className="hero-reveal mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary"
              style={{ animationDelay: "0ms" }}
            >
              <Sparkles className="h-4 w-4" />
              Learn from quality, project-based courses
            </div>

            <h1
              className="hero-reveal mb-6 max-w-[16ch] text-balance font-heading text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.02em]"
              style={{ animationDelay: "60ms" }}
            >
              The platform to{" "}
              <span className="hero-title-accent bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                empower your skills
              </span>
            </h1>

            <p
              className="hero-reveal mb-8 max-w-md text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "120ms" }}
            >
              Guided courses, live classrooms, and paid tasks — all in one dashboard.
            </p>

            <div
              className="hero-reveal mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "180ms" }}
            >
              <SiteNavLink href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full px-8 shadow-lg shadow-emerald-950/25 sm:w-auto">
                  Start learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SiteNavLink>
              <SiteNavLink href="/courses" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-border/80 bg-background/60 px-8 backdrop-blur-sm sm:w-auto"
                >
                  Browse courses
                </Button>
              </SiteNavLink>
            </div>

            <p className="hero-reveal text-sm text-muted-foreground" style={{ animationDelay: "240ms" }}>
              Start your education journey — for a better future.
            </p>
          </div>

          {/* Visual */}
          <div className="hero-reveal relative mx-auto w-full max-w-lg pt-10 lg:max-w-none">
            {/* Decorative shapes */}
            <div className="pointer-events-none absolute -left-4 top-14 h-16 w-16 rotate-12 rounded-lg bg-primary/20 blur-[1px]" />
            <div className="pointer-events-none absolute right-8 top-8 flex gap-1.5">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-primary/40" />
              ))}
            </div>
            <div className="pointer-events-none absolute -right-2 bottom-16 h-10 w-10 rounded-full border-4 border-primary/30" />

            {/* Main card */}
            <div className="hero-mesh relative overflow-hidden rounded-2xl border border-border/70 p-6 shadow-2xl shadow-emerald-950/20 sm:rounded-3xl sm:p-10 dark:border-white/10 dark:shadow-emerald-950/40">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative space-y-6 text-zinc-950 dark:text-zinc-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-300/25 to-emerald-500/10 text-emerald-800 shadow-inner dark:text-emerald-300 sm:h-16 sm:w-16">
                  <Code2 className="h-7 w-7" strokeWidth={1.6} />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-700 dark:text-emerald-100/70">
                    Earn while you learn
                  </p>
                  <h2 className="max-w-[19ch] font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                    Build real projects. Get paid in{" "}
                    <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent dark:from-amber-300 dark:to-amber-500">₦</span>.
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
                      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-black/10 bg-white/35 px-1.5 py-3 text-center shadow-sm backdrop-blur-md transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] sm:px-2"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-800 dark:text-emerald-300">
                        <Icon className="h-5 w-5 transition-transform duration-150 group-hover:scale-105" strokeWidth={1.75} />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100/85 sm:text-xs">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating learner pill */}
            <div className="absolute left-3 top-0 z-20 max-w-[calc(100%-1.5rem)] rounded-full border border-border/70 bg-card/95 px-3 py-2 shadow-xl shadow-black/10 backdrop-blur-xl sm:left-5 sm:px-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[Users, Award, BookOpen].map((Icon, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 border-card",
                        i === 0 && "bg-primary/20 text-primary",
                        i === 1 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                        i === 2 && "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-base font-bold tabular-nums leading-none">
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
