"use client"

import { BookOpen, ClipboardList, DollarSign } from "lucide-react"

const steps = [
  {
    title: "Learn a skill",
    description: "Follow guided lessons, build real projects, and gain the skills employers want.",
    icon: BookOpen,
  },
  {
    title: "Complete real tasks",
    description: "Finish practical assignments that mirror what you’ll do on the job or for clients.",
    icon: ClipboardList,
  },
  {
    title: "Get paid",
    description: "Turn your work into income with verified tasks and freelance opportunities.",
    icon: DollarSign,
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/40 border-y border-border/60">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-primary font-semibold text-base uppercase tracking-wider mb-3">
            How it works
          </span>
          <h2 className="mb-4 text-balance">
            Step-by-step learning built for real results
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A clear path from practical lessons to paid tasks — so you gain real skills and start earning.
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="hidden md:block absolute top-14 left-[16%] right-[16%] h-px bg-border" aria-hidden />
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
