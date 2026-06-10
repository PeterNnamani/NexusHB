"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Search, MessageSquare, BookOpen, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StudentRow {
  id: string
  name: string
  email: string
  avatar: string | null
  joinedAt: string | null
  courses: { courseId: string; title: string; progress: number; enrolledAt: string | null }[]
}

export function TutorStudents() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/tutor/students")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setStudents(d?.students || [])
        setTotal(d?.total || 0)
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  )

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-1">
          Learners enrolled in your courses — track progress and reach out when needed.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-muted-foreground">Active students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No students yet</h3>
          <p className="text-muted-foreground mt-1">
            Students appear here once they enroll in your published courses.
          </p>
          <Link href="/dashboard/my-courses?view=created">
            <Button className="mt-4">Manage your courses</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((student) => (
            <div key={student.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-11 w-11">
                    {student.avatar && <AvatarImage src={student.avatar} alt={student.name} />}
                    <AvatarFallback>{initials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    {student.joinedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {new Date(student.joinedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Link href="/dashboard/messages">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {student.courses.map((c) => (
                  <div key={c.courseId} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{c.title}</span>
                      </div>
                      <Badge variant="secondary">{c.progress}%</Badge>
                    </div>
                    <Progress value={c.progress} className="h-2" />
                    {c.enrolledAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Enrolled {new Date(c.enrolledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
