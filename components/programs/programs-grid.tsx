import Link from "next/link"
import { ArrowRight, Clock, BookOpen, Award, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const programs = [
  {
    id: 1,
    title: "Full Stack Web Development",
    description: "Master both frontend and backend development with our comprehensive program covering React, Node.js, databases, and deployment.",
    duration: "6 months",
    courses: 12,
    students: 4500,
    level: "Beginner to Advanced",
    price: 999,
    featured: true,
    color: "from-primary/20 to-primary/5",
    skills: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB", "AWS"],
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
  },
  {
    id: 2,
    title: "Frontend Engineering",
    description: "Become an expert frontend developer specializing in modern JavaScript frameworks, responsive design, and performance optimization.",
    duration: "4 months",
    courses: 8,
    students: 3200,
    level: "Beginner to Intermediate",
    price: 699,
    featured: false,
    color: "from-secondary/20 to-secondary/5",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Testing"],
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Backend Development",
    description: "Learn server-side programming, database management, API development, and cloud deployment with industry best practices.",
    duration: "4 months",
    courses: 8,
    students: 2800,
    level: "Intermediate",
    price: 699,
    featured: false,
    color: "from-chart-3/20 to-chart-3/5",
    skills: ["Node.js", "Python", "PostgreSQL", "Redis", "Docker", "AWS"],
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
  },
  {
    id: 4,
    title: "UI/UX Design Professional",
    description: "Master user interface design, user experience principles, prototyping tools, and design systems for modern web applications.",
    duration: "3 months",
    courses: 6,
    students: 2100,
    level: "Beginner to Intermediate",
    price: 599,
    featured: false,
    color: "from-chart-4/20 to-chart-4/5",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Accessibility"],
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
  },
]

export function ProgramsGrid() {
  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          {programs.map((program, index) => (
            <div
              key={program.id}
              className={`glass-card rounded-3xl overflow-hidden ${
                index % 2 === 0 ? "" : "lg:flex-row-reverse"
              }`}
            >
              <div className="grid lg:grid-cols-2">
                {/* Image */}
                <div className={`relative aspect-video lg:aspect-auto ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${program.color} mix-blend-overlay`} />
                  {program.featured && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 lg:p-10 flex flex-col">
                  <Badge variant="secondary" className="w-fit mb-4">
                    {program.level}
                  </Badge>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                    {program.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {program.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{program.courses} courses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{program.students.toLocaleString()} enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Certificate included</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {program.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-muted rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                    <div>
                      <span className="text-3xl font-bold">${program.price}</span>
                      <span className="text-muted-foreground ml-2">one-time</span>
                    </div>
                    <Link href={`/programs/${program.id}`}>
                      <Button className="rounded-full group">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
