"use client"

import { ShieldCheck, Sparkles } from "lucide-react"

const benefits = [
  {
    title: "Task-based learning",
    description: "Complete real projects that mirror client work and build a portfolio while you learn.",
  },
  {
    title: "Earn in Naira",
    description: "Turn your skills into income quickly with verified payments and student payouts.",
  },
  {
    title: "Mentorship support",
    description: "Get help from experienced instructors and career coaches every step of the way.",
  },
]

export function AboutSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
              About Nexus
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Practical learning designed for fast growth and real earnings.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-8">
              Nexus helps ambitious learners in Nigeria build real web development skills, complete paid tasks, and start earning in Naira. Our courses are built around projects, payments, and career support.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              <ShieldCheck className="h-4 w-4" />
              Why learners choose Nexus
            </span>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-foreground font-medium">Project-first curriculum</strong> — build portfolio work, not passive video watching.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-foreground font-medium">Naira-ready outcomes</strong> — tasks and courses tied to real earning paths.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><strong className="text-foreground font-medium">One dashboard</strong> — courses, live classes, payments, and certificates together.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
