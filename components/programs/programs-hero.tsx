import { GraduationCap, Clock, Trophy, Briefcase } from "lucide-react"

const highlights = [
  { icon: Clock, label: "3-6 Months", description: "Flexible duration" },
  { icon: GraduationCap, label: "Expert-Led", description: "Industry instructors" },
  { icon: Trophy, label: "Certified", description: "Industry recognized" },
  { icon: Briefcase, label: "Job Ready", description: "Career support" },
]

export function ProgramsHero() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Structured Learning Paths
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Professional Programs
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Comprehensive career-focused programs designed to take you from beginner 
            to job-ready professional with structured curriculum and dedicated support.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-lg mb-1">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
