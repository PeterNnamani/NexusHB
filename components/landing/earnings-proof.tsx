import { ShieldCheck, TrendingUp, Users } from "lucide-react"

const proofs = [
  {
    title: "₦300,000 paid this month",
    description: "Students earned real income from live tasks and client work.",
    icon: TrendingUp,
  },
  {
    title: "Trusted by over 10,000 learners",
    description: "Thousands of students have completed courses and landed earning gigs.",
    icon: Users,
  },
  {
    title: "Secure payments & fast support",
    description: "Pay safely and start learning with confidence.",
    icon: ShieldCheck,
  },
]

export function EarningsProofSection() {
  return (
    <section className="py-20 lg:py-32 relative bg-surface/80">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Earnings proof
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Real payments. Real students. Real results.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We help learners earn from day one. See why students trust Nexus for skill training and income-ready courses.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {proofs.map((proof) => {
            const Icon = proof.icon
            return (
              <div key={proof.title} className="glass-card rounded-3xl p-8 border border-white/10 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 flex items-center justify-center">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{proof.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{proof.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
