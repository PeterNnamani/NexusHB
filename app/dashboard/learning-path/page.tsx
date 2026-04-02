"use client"

import { useState } from "react"
import { 
  GraduationCap, 
  CheckCircle2, 
  Circle, 
  Lock,
  Clock,
  Trophy,
  ChevronRight,
  Play,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const learningPaths = [
  {
    id: 1,
    title: "Full-Stack Web Developer",
    description: "Master both frontend and backend development to become a complete web developer",
    progress: 45,
    totalCourses: 8,
    completedCourses: 3,
    estimatedTime: "6 months",
    level: "Intermediate",
    active: true,
    milestones: [
      { id: 1, title: "HTML & CSS Fundamentals", status: "completed", courses: 2 },
      { id: 2, title: "JavaScript Mastery", status: "completed", courses: 2 },
      { id: 3, title: "React Development", status: "in-progress", courses: 2 },
      { id: 4, title: "Node.js Backend", status: "locked", courses: 2 },
      { id: 5, title: "Database & APIs", status: "locked", courses: 2 },
      { id: 6, title: "Deployment & DevOps", status: "locked", courses: 1 },
    ],
  },
  {
    id: 2,
    title: "Frontend Specialist",
    description: "Deep dive into modern frontend technologies and UI/UX principles",
    progress: 20,
    totalCourses: 6,
    completedCourses: 1,
    estimatedTime: "4 months",
    level: "Intermediate",
    active: false,
    milestones: [
      { id: 1, title: "Advanced CSS & Animations", status: "completed", courses: 1 },
      { id: 2, title: "React Advanced Patterns", status: "in-progress", courses: 2 },
      { id: 3, title: "State Management", status: "locked", courses: 1 },
      { id: 4, title: "Testing & Performance", status: "locked", courses: 2 },
    ],
  },
  {
    id: 3,
    title: "Backend Engineer",
    description: "Build scalable server-side applications and APIs",
    progress: 0,
    totalCourses: 7,
    completedCourses: 0,
    estimatedTime: "5 months",
    level: "Advanced",
    active: false,
    milestones: [
      { id: 1, title: "Node.js Fundamentals", status: "locked", courses: 2 },
      { id: 2, title: "Database Design", status: "locked", courses: 2 },
      { id: 3, title: "API Development", status: "locked", courses: 2 },
      { id: 4, title: "Security & Authentication", status: "locked", courses: 1 },
    ],
  },
]

export default function LearningPathPage() {
  const [selectedPath, setSelectedPath] = useState(learningPaths[0])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Learning Path</h1>
        <p className="text-muted-foreground mt-1">
          Follow structured paths to achieve your career goals
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Path Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Your Learning Paths</h2>
          <div className="space-y-3">
            {learningPaths.map((path) => (
              <button
                key={path.id}
                onClick={() => setSelectedPath(path)}
                className={cn(
                  "w-full glass-card p-4 rounded-2xl text-left transition-all",
                  selectedPath.id === path.id 
                    ? "ring-2 ring-primary" 
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{path.title}</h3>
                      {path.active && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {path.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    selectedPath.id === path.id && "text-primary rotate-90"
                  )} />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{path.progress}%</span>
                  </div>
                  <Progress value={path.progress} className="h-2" />
                </div>
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full">
            Explore More Paths
          </Button>
        </div>

        {/* Path Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Path Overview */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedPath.title}</h2>
                <p className="text-muted-foreground mt-1">{selectedPath.description}</p>
              </div>
              {!selectedPath.active && (
                <Button>Start This Path</Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-muted/50">
                <GraduationCap className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-lg font-bold">{selectedPath.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Courses</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50">
                <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-lg font-bold">{selectedPath.completedCourses}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50">
                <Clock className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                <p className="text-lg font-bold">{selectedPath.estimatedTime}</p>
                <p className="text-xs text-muted-foreground">Est. Time</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50">
                <Star className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-lg font-bold">{selectedPath.level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{selectedPath.progress}%</span>
              </div>
              <Progress value={selectedPath.progress} className="h-3" />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Milestones</h3>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {selectedPath.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="relative flex gap-4">
                    {/* Timeline Node */}
                    <div className={cn(
                      "relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      milestone.status === "completed" && "bg-green-500 text-white",
                      milestone.status === "in-progress" && "bg-primary text-primary-foreground",
                      milestone.status === "locked" && "bg-muted text-muted-foreground"
                    )}>
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : milestone.status === "in-progress" ? (
                        <Play className="h-6 w-6" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div className={cn(
                      "flex-1 glass-card p-4 rounded-2xl",
                      milestone.status === "locked" && "opacity-60"
                    )}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                            <Badge variant={
                              milestone.status === "completed" ? "default" :
                              milestone.status === "in-progress" ? "secondary" : "outline"
                            } className={milestone.status === "completed" ? "bg-green-500" : ""}>
                              {milestone.status === "completed" ? "Completed" :
                               milestone.status === "in-progress" ? "In Progress" : "Locked"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.courses} courses in this milestone
                          </p>
                        </div>
                        {milestone.status !== "locked" && (
                          <Button 
                            variant={milestone.status === "completed" ? "outline" : "default"}
                            size="sm"
                          >
                            {milestone.status === "completed" ? "Review" : "Continue"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Completion Badge */}
          <div className="glass-card p-6 rounded-2xl text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Path Completion Certificate</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Complete all milestones to earn your {selectedPath.title} certificate
            </p>
            <Progress value={selectedPath.progress} className="h-2 mt-4 max-w-xs mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              {selectedPath.progress}% complete - {100 - selectedPath.progress}% to go!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
