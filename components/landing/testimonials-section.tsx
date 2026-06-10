"use client"

import { useState, useEffect } from "react"
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Testimonial {
  id: string
  name: string
  role: string | null
  company: string | null
  avatar: string | null
  quote: string
  rating: number
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "fallback-1",
    name: "Ada O.",
    role: "Freelance developer",
    company: "Lagos",
    avatar: null,
    quote:
      "Nexus helped me move from tutorials to real projects. I completed tasks, built a portfolio, and landed my first paid client within weeks.",
    rating: 5,
  },
  {
    id: "fallback-2",
    name: "Emeka N.",
    role: "Student",
    company: "Abuja",
    avatar: null,
    quote:
      "The live classroom and structured lessons kept me accountable. Paystack checkout made enrolling simple — I could focus on learning, not payment hassles.",
    rating: 5,
  },
  {
    id: "fallback-3",
    name: "Fatima B.",
    role: "Career switcher",
    company: "Kano",
    avatar: null,
    quote:
      "I wanted practical web skills, not theory-only courses. Nexus courses are project-based and the dashboard shows exactly where I stand.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => {
        const list = d.testimonials || []
        setTestimonials(list.length > 0 ? list : FALLBACK_TESTIMONIALS)
      })
      .catch(() => setTestimonials(FALLBACK_TESTIMONIALS))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  const active = testimonials[activeIndex]
  const roleLine = [active.role, active.company].filter(Boolean).join(" at ")

  const next = () => setActiveIndex((p) => (p + 1) % testimonials.length)
  const prev = () => setActiveIndex((p) => (p - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center mb-10 lg:mb-0">
          <div className="text-center lg:text-left">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            What Our Students Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Real stories from learners who transformed their careers with Nexus.
          </p>
          </div>

        <div className="max-w-4xl lg:max-w-none mx-auto">
          <div className="glass-card rounded-3xl p-8 lg:p-12 relative">
            <Quote className="absolute top-8 left-8 h-12 w-12 text-primary/20" />

            <div className="relative z-10">
              <p className="text-xl lg:text-2xl leading-relaxed mb-8 text-center">{active.quote}</p>

              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(active.rating || 5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              <div className="flex flex-col items-center">
                {active.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.avatar}
                    alt={active.name}
                    className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-2 ring-primary/20 text-primary text-xl font-semibold">
                    {active.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 className="font-semibold text-lg">{active.name}</h4>
                {roleLine && <p className="text-sm text-muted-foreground">{roleLine}</p>}
              </div>
            </div>

            {testimonials.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button variant="outline" size="icon" onClick={prev} className="glass-button rounded-full">
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeIndex ? "w-8 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                <Button variant="outline" size="icon" onClick={next} className="glass-button rounded-full">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
