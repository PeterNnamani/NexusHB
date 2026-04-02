import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

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
            <Link href="/" className="flex items-center">
              <div className="relative w-24 h-8 dark:invert">
                <Image
                  src="/images/Logo.jpeg"
                  alt="Nexus Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
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
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="glass-card rounded-3xl p-8 max-w-md">
            <blockquote className="text-xl font-medium mb-6 leading-relaxed">
              &quot;Nexus transformed my career. In just 8 months, I went from knowing 
              nothing about coding to landing my dream job at a top tech company.&quot;
            </blockquote>
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Sarah Johnson"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Frontend Developer at Spotify</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
