import Link from "next/link"
import { ArrowRight, Clock, Award, Users, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPrograms } from "@/lib/content-db"

export async function ProgramsGrid() {
  const programs = await getPrograms()

  if (programs.length === 0) {
    return (
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">Programs coming soon</h2>
          <p className="text-muted-foreground mt-1 mb-6">
            In the meantime, explore our full course catalog.
          </p>
          <Link href="/courses">
            <Button className="rounded-full">Browse Courses</Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          {programs.map((program, index) => (
            <div key={program.id} className="glass-card rounded-3xl overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {program.image && (
                  <div className={`relative aspect-video lg:aspect-auto ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
                    {program.featured && (
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">Featured</Badge>
                    )}
                  </div>
                )}

                <div className="p-6 lg:p-10 flex flex-col">
                  {program.level && (
                    <Badge variant="secondary" className="w-fit mb-4">
                      {program.level}
                    </Badge>
                  )}
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4">{program.title}</h3>
                  {program.description && (
                    <p className="text-muted-foreground mb-6 leading-relaxed">{program.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mb-6">
                    {program.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{program.duration}</span>
                      </div>
                    )}
                    {program.students_count > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{program.students_count.toLocaleString()} enrolled</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Certificate included</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                    <div>
                      {program.price > 0 ? (
                        <>
                          <span className="text-3xl font-bold">₦{program.price.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-2">one-time</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">Free</span>
                      )}
                    </div>
                    <Link href="/courses">
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
