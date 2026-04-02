"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Play, Users, BookOpen, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { icon: Users, value: "10K+", label: "Active Students" },
  { icon: BookOpen, value: "150+", label: "Courses" },
  { icon: Award, value: "50+", label: "Certifications" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-30 dark:opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-secondary/5" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground/80">
                Now Enrolling for 2026
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 text-balance">
              Learn Skills & Start Earning in Naira
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 text-pretty">
              Practical courses that turn skills into real paid tasks. Learn, complete projects, and get paid in Nigeria’s currency.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 h-14 text-base group">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  variant="outline"
                  size="lg"
                  className="glass-button rounded-full px-8 h-14 text-base group"
                >
                  View Courses
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-foreground/90">
                <span>💰</span> Students earned ₦250,000+ this month
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-3 text-sm text-foreground/90">
                <span>🧠</span> Real tasks after every course
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 lg:gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl lg:text-3xl font-bold">{stat.value}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Preview Card */}
          <div className="relative">
            <div className="glass-card rounded-3xl p-6 lg:p-8 border border-white/10 shadow-2xl">
              <div className="grid gap-6">
                <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted">
                  <Image
                    src="/images/Flier.jpeg"
                    alt="Course preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Task-based learning</span>
                    <span className="text-sm font-semibold text-secondary">₦5,000+ earnings</span>
                  </div>
                  <h3 className="text-2xl font-semibold">Build a portfolio-ready website</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete practical tasks after each module, get client-ready skills and start earning in Naira.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-background/80 p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">₦250K+</p>
                      <p className="text-xs text-muted-foreground">earned this month</p>
                    </div>
                    <div className="rounded-3xl bg-background/80 p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">Real tasks</p>
                      <p className="text-xs text-muted-foreground">after every course</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-muted-foreground">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </section>
  )
}
