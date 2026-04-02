import { 
  Code2, 
  Laptop, 
  Users, 
  Zap, 
  Shield, 
  Trophy,
  GraduationCap,
  Clock
} from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Hands-on Projects",
    description: "Build real-world applications with guided projects that reinforce your learning and build your portfolio.",
  },
  {
    icon: GraduationCap,
    title: "Expert Instructors",
    description: "Learn from industry professionals with years of experience at top tech companies worldwide.",
  },
  {
    icon: Laptop,
    title: "Learn Anywhere",
    description: "Access courses on any device. Study at your own pace with lifetime access to all materials.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join a thriving community of learners. Get help, share knowledge, and network with peers.",
  },
  {
    icon: Zap,
    title: "Interactive Learning",
    description: "Engage with quizzes, coding challenges, and interactive exercises that make learning fun.",
  },
  {
    icon: Trophy,
    title: "Certifications",
    description: "Earn industry-recognized certificates upon completion to boost your career prospects.",
  },
  {
    icon: Shield,
    title: "Job Guarantee",
    description: "Our career services team helps you land your dream job or get a full refund.",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Self-paced learning that fits your lifestyle. No deadlines, no pressure.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Why Choose Nexus
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            We provide all the tools, resources, and support you need to transform 
            from a beginner to a professional web developer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-6 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
