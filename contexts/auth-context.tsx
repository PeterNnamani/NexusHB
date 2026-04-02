"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  enrolledCourses: string[]
  completedCourses: number[]
  streak: number
  lastActivityDate?: string
  courseProgress?: Record<number, number>
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  enrollCourse: (courseId: string) => Promise<void>
  completeCourse: (courseId: number) => void
  updateCourseProgress: (courseId: number, progress: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated with Supabase
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        if (data.user) {
          let enrolledCourses: string[] = []
          try {
            const enrollRes = await fetch(`/api/user-courses?userId=${encodeURIComponent(data.user.id)}`)
            const enrollData = await enrollRes.json()
            if (enrollRes.ok && Array.isArray(enrollData.courseIds)) {
              enrolledCourses = enrollData.courseIds.map((id: string | number) => String(id))
            }
          } catch (err) {
            console.warn('Could not load enrolled courses on auth check:', err)
          }

          const mergedUser = { ...data.user, enrolledCourses }
          setUser(mergedUser)
          localStorage.setItem("nexus_user", JSON.stringify(mergedUser))
        } else {
          // Fallback to localStorage
          const storedUser = localStorage.getItem("nexus_user")
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser)
              if (parsedUser?.id) {
                try {
                  const enrollRes = await fetch(`/api/user-courses?userId=${encodeURIComponent(parsedUser.id)}`)
                  const enrollData = await enrollRes.json()
                  if (enrollRes.ok && Array.isArray(enrollData.courseIds)) {
                    parsedUser.enrolledCourses = enrollData.courseIds.map((id: string | number) => String(id))
                  }
                } catch (err) {
                  console.warn('Could not refresh enrolled courses in local fallback:', err)
                }
              }
              setUser(parsedUser)
            } catch {
              localStorage.removeItem("nexus_user")
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Fallback to localStorage
        const storedUser = localStorage.getItem("nexus_user")
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            if (parsedUser?.id) {
              try {
                const enrollRes = await fetch(`/api/user-courses?userId=${encodeURIComponent(parsedUser.id)}`)
                const enrollData = await enrollRes.json()
                if (enrollRes.ok && Array.isArray(enrollData.courseIds)) {
                  parsedUser.enrolledCourses = enrollData.courseIds.map((id: string | number) => String(id))
                }
              } catch (err) {
                console.warn('Could not refresh enrolled courses in catch fallback:', err)
              }
            }
            setUser(parsedUser)
          } catch {
            localStorage.removeItem("nexus_user")
          }
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      // Call the login API to authenticate with Supabase
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Set user in state and localStorage
      setUser(data.user)
      localStorage.setItem("nexus_user", JSON.stringify(data.user))
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      // Call the signup API to create user in Supabase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' }
      }

      // Set user in state and localStorage
      setUser(data.user)
      localStorage.setItem("nexus_user", JSON.stringify(data.user))
      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("nexus_user")
    router.push("/")
  }

  const enrollCourse = async (courseId: string) => {
    if (!user) return

    // Add to local user object
    if (!user.enrolledCourses.includes(courseId)) {
      const updatedUser = { ...user, enrolledCourses: [...user.enrolledCourses, courseId] }
      setUser(updatedUser)
      localStorage.setItem("nexus_user", JSON.stringify(updatedUser))
    }

    // Save to enrollments.json
    try {
      await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId,
          email: user.email,
          enrolledDate: new Date().toISOString(),
          progress: 0,
        }),
      })
    } catch (error) {
      console.error("Failed to save enrollment:", error)
    }
  }

  const completeCourse = (courseId: number) => {
    if (!user) return

    const today = new Date().toDateString()
    const lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate).toDateString() : null
    
    let newStreak = user.streak
    if (lastActivityDate !== today) {
      if (lastActivityDate) {
        const lastDate = new Date(user.lastActivityDate!)
        const currentDate = new Date()
        const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        newStreak = diffDays === 1 ? user.streak + 1 : diffDays === 0 ? user.streak : 1
      } else {
        newStreak = 1
      }
    }

    const completedCourses = user.completedCourses.includes(courseId)
      ? user.completedCourses
      : [...user.completedCourses, courseId]

    const updatedUser = {
      ...user,
      completedCourses,
      streak: newStreak,
      lastActivityDate: new Date().toISOString(),
    }

    setUser(updatedUser)
    localStorage.setItem("nexus_user", JSON.stringify(updatedUser))
  }

  const updateCourseProgress = useCallback((courseId: number, progress: number) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser

      const normalizedProgress = Math.min(progress, 100)
      const currentProgress = prevUser.courseProgress?.[courseId] ?? 0
      if (currentProgress === normalizedProgress) {
        return prevUser
      }

      const courseProgress = {
        ...(prevUser.courseProgress || {}),
        [courseId]: normalizedProgress,
      }

      const updatedUser = { ...prevUser, courseProgress }
      localStorage.setItem("nexus_user", JSON.stringify(updatedUser))
      return updatedUser
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        enrollCourse,
        completeCourse,
        updateCourseProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
