import {
  Code2,
  Laptop,
  Users,
  Trophy,
  Lock,
  Clock,
} from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Hands-on Projects",
    description: "Build real-world applications with guided projects that reinforce your learning and grow your portfolio.",
  },
  {
    icon: Laptop,
    title: "Learn Anywhere",
    description: "Access your courses on any device and study at your own pace, whenever it suits you.",
  },
  {
    icon: Trophy,
    title: "Earn Certificates",
    description: "Get a certificate when you complete a course to showcase your new skills.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Connect with fellow learners and instructors to get help and share knowledge.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Pay safely with Paystack — cards, bank transfer and USSD supported.",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Self-paced learning that fits your lifestyle. Track your progress from your dashboard.",
  },
]

export function FeaturesSection() {
  const [highlight, ...rest] = features

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block text-primary font-semibold text-base uppercase tracking-wider mb-3">
            Why Choose Nexus
          </span>
          <h2 className="mb-4 text-balance">
            Everything you need to succeed
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Practical training and the tools to take you from beginner to job-ready web developer.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:row-span-2 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/8 via-card to-card p-8 flex flex-col justify-between group hover:border-primary/35 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <highlight.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-2xl mb-3">{highlight.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{highlight.description}</p>
            </div>
            <p className="mt-8 text-sm font-medium text-primary">
              Build portfolio-ready work from day one.
            </p>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {rest.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
