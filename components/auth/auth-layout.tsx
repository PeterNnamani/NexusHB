import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { NexusLogo } from "@/components/brand/nexus-logo"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <NexusLogo size="3xl" priority />
            <ThemeToggle />
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {/* Form */}
          {children}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <Image
          src="/images/Flier.jpeg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="glass-card rounded-3xl p-8 max-w-md">
            <h2 className="text-2xl font-semibold mb-4 leading-snug">
              Learn web development. Build real projects. Grow your skills.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Practical, project-based courses designed to take you from beginner to
              job-ready — with secure payments and a dashboard that tracks your progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
