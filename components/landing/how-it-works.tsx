import { BookOpen, ClipboardList, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    <section className="py-20 lg:py-32 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Learn, complete tasks, and earn in Naira.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our learning path is built to move you from beginner to paid work quickly. Each step is focused on skill mastery and earning fast.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="glass-card rounded-3xl p-8 border border-white/10 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 flex items-center justify-center">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/courses">
            <Button size="lg" className="rounded-full px-10">
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
