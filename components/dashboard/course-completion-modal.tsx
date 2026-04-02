"use client"

import { useEffect, useState } from "react"
import { Trophy, Flame, Star, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CourseCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  streak: number
  totalCompleted: number
}

export function CourseCompletionModal({
  isOpen,
  onClose,
  courseTitle,
  streak,
  totalCompleted,
}: CourseCompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load confetti library from CDN
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.0/dist/confetti.browser.min.js"
      script.async = true
      script.onload = () => {
        setShowConfetti(true)
        // Trigger confetti animation
        if (typeof window !== "undefined" && "confetti" in window) {
          const confetti = (window as any).confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        }
      }
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-3xl max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center space-y-6">
          {/* Trophy Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="h-24 w-24 text-yellow-500 animate-bounce" />
              <Star className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-spin" />
            </div>
          </div>

          {/* Main Message */}
          <div>
            <h2 className="text-3xl font-bold bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
              Congratulations!
            </h2>
            <p className="text-lg text-muted-foreground">
              You've completed <span className="font-semibold text-foreground">{courseTitle}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak */}
            <div className="glass-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Current Streak</span>
              </div>
              <p className="text-3xl font-bold text-orange-500">{streak}</p>
              <p className="text-xs text-muted-foreground mt-1">day{streak !== 1 ? "s" : ""}</p>
            </div>

            {/* Total Completed */}
            <div className="glass-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-3xl font-bold text-emerald-500">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">course{totalCompleted !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Achievement Message */}
          <div className="bg-primary/10 rounded-xl p-3">
            <p className="text-sm text-primary font-medium">
              🎉 Keep it up! You're building amazing momentum
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full rounded-full h-12 text-base font-semibold"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    </div>
  )
}
