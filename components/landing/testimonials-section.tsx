"use client"

import { useState } from "react"
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Frontend Developer at Spotify",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    content: "Nexus transformed my career completely. The courses are comprehensive, the instructors are world-class, and the community support is incredible. I went from knowing nothing about web development to landing my dream job in just 8 months.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Full Stack Developer at Meta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    content: "The project-based learning approach is what sets Nexus apart. I built a portfolio of real applications that impressed hiring managers. The career services team was instrumental in helping me negotiate a great salary.",
    rating: 5,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "UI/UX Designer at Apple",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    content: "I was skeptical about online learning, but Nexus proved me wrong. The interactive exercises and live sessions made learning engaging and effective. I highly recommend it to anyone looking to break into tech.",
    rating: 5,
  },
  {
    id: 4,
    name: "David Okonkwo",
    role: "Backend Engineer at Amazon",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    content: "The depth of content in the backend courses is remarkable. I learned not just how to code, but how to build scalable, production-ready systems. The mentorship program was a game-changer for my growth.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            What Our Students Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful developers who transformed their careers with Nexus.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 lg:p-12 relative">
            <Quote className="absolute top-8 left-8 h-12 w-12 text-primary/20" />
            
            <div className="relative z-10">
              {/* Content */}
              <p className="text-xl lg:text-2xl leading-relaxed mb-8 text-center">
                {testimonials[activeIndex].content}
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Author */}
              <div className="flex flex-col items-center">
                <img
                  src={testimonials[activeIndex].avatar}
                  alt={testimonials[activeIndex].name}
                  className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-primary/20"
                />
                <h4 className="font-semibold text-lg">
                  {testimonials[activeIndex].name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {testimonials[activeIndex].role}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="glass-button rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeIndex
                        ? "w-8 bg-primary"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="glass-button rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
