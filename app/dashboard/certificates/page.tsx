"use client"

import { useState } from "react"
import { 
  Trophy, 
  Download, 
  Share2, 
  ExternalLink,
  Award,
  Calendar,
  Clock,
  Search,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const certificates = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    issueDate: "2024-02-15",
    credential: "NEXUS-WEB-2024-001234",
    type: "Course Completion",
    category: "Web Development",
    hours: 42,
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    instructor: "Dr. Sarah Chen",
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    issueDate: "2024-01-28",
    credential: "NEXUS-REACT-2024-005678",
    type: "Course Completion",
    category: "Frontend",
    hours: 18,
    skills: ["React", "Hooks", "Context API", "Performance"],
    instructor: "Michael Torres",
  },
  {
    id: 3,
    title: "TypeScript Deep Dive",
    issueDate: "2024-01-10",
    credential: "NEXUS-TS-2024-009012",
    type: "Course Completion",
    category: "Programming",
    hours: 20,
    skills: ["TypeScript", "Type Safety", "Generics", "Decorators"],
    instructor: "Dr. Sarah Chen",
  },
  {
    id: 4,
    title: "Node.js Backend Mastery",
    issueDate: "2023-12-20",
    credential: "NEXUS-NODE-2023-003456",
    type: "Course Completion",
    category: "Backend",
    hours: 28,
    skills: ["Node.js", "Express", "REST APIs", "MongoDB"],
    instructor: "Emily Watson",
  },
  {
    id: 5,
    title: "Frontend Developer Path",
    issueDate: "2024-02-01",
    credential: "NEXUS-PATH-FE-2024-001",
    type: "Learning Path",
    category: "Career Path",
    hours: 120,
    skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Testing"],
    instructor: "Multiple Instructors",
  },
]

const achievements = [
  { id: 1, title: "Early Bird", description: "Completed 5 lessons before 8 AM", icon: "🌅", date: "2024-02-10" },
  { id: 2, title: "Streak Master", description: "30-day learning streak", icon: "🔥", date: "2024-02-05" },
  { id: 3, title: "Quick Learner", description: "Completed a course in under a week", icon: "⚡", date: "2024-01-25" },
  { id: 4, title: "Perfectionist", description: "Scored 100% on 10 quizzes", icon: "💯", date: "2024-01-15" },
]

export default function CertificatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || cert.type.toLowerCase().includes(filter)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Certificates & Achievements</h1>
        <p className="text-muted-foreground mt-1">
          View and share your earned certificates and achievements
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{achievements.length}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {certificates.reduce((acc, c) => acc + c.hours, 0)}h
              </p>
              <p className="text-sm text-muted-foreground">Total Learning</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(certificates.flatMap(c => c.skills)).size}
              </p>
              <p className="text-sm text-muted-foreground">Skills Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="glass-card p-4 rounded-2xl text-center">
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h3 className="font-semibold text-foreground">{achievement.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(achievement.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl font-semibold">Your Certificates</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="path">Learning Path</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredCertificates.map((cert) => (
            <div key={cert.id} className="glass-card p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Certificate Preview */}
                <div className="w-full md:w-48 h-32 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium text-primary">CERTIFICATE</p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{cert.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Issued by {cert.instructor} on {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{cert.type}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cert.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {cert.hours} hours
                    </span>
                    <span>Credential ID: {cert.credential}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No certificates found</h3>
            <p className="text-muted-foreground mt-1">
              Complete courses to earn certificates
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
