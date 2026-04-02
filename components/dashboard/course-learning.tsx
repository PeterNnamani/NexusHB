"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Play, Clock, BookOpen, BarChart3, ArrowLeft, Download, ClipboardList, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CourseCompletionModal } from "./course-completion-modal"
import { useAuth } from "@/contexts/auth-context"

interface Video {
  id: string
  title: string
  url: string
  duration: string
}

interface SyllabusWeek {
  week: number
  topic: string
  duration: string
  videos: Video[]
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  instructor: string
  price: number
  image: string
  level: string
  duration: string
  rating: number
  students: number
  lessons: number
  syllabus: SyllabusWeek[]
}

interface CourseLearningProps {
  courseId: string
  onBack: () => void
}

type TabType = "overview" | "materials" | "assignments" | "quiz" | "grades"

export function CourseLearning({ courseId, onBack }: CourseLearningProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [numericCourseId, setNumericCourseId] = useState<number | null>(null)
  const [completedTopics, setCompletedTopics] = useState<Set<number>>(new Set())
  const [courseCompletedData, setCourseCompletedData] = useState<{ streak: number; totalCompleted: number } | null>(null)
  const { user, completeCourse, updateCourseProgress } = useAuth()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const response = await fetch('/courses.json')
        const data = await response.json()
        let foundCourse: Course | undefined
        
        // Parse courseId as number (should be 1, 2, 3, etc.)
        const courseNum = parseInt(courseId)
        
        if (!isNaN(courseNum)) {
          // Set numeric course ID
          setNumericCourseId(courseNum)
          // Get course from JSON using index
          foundCourse = data.courses[courseNum - 1]
        } else {
          // If courseId is not numeric, try to find by string ID
          foundCourse = data.courses.find((c: Course) => c.id === courseId)
          // If found by string, extract index and set numeric ID
          if (foundCourse) {
            const index = data.courses.indexOf(foundCourse) + 1
            setNumericCourseId(index)
          }
        }
        
        if (foundCourse) {
          setCourse(foundCourse)
          setSelectedWeek(1)
          if (foundCourse.syllabus?.[0]?.videos?.[0]) {
            setSelectedVideo(foundCourse.syllabus[0].videos[0])
          }
        }
      } catch (error) {
        console.error('Failed to load course:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId])

  // Update course progress whenever completed topics change
  useEffect(() => {
    if (course && numericCourseId) {
      const totalTopics = course.syllabus.length
      const completedCount = completedTopics.size
      const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0
      updateCourseProgress(numericCourseId, progress)
    }
  }, [completedTopics, course, numericCourseId, updateCourseProgress])

  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(week)) {
      newExpanded.delete(week)
    } else {
      newExpanded.add(week)
    }
    setExpandedWeeks(newExpanded)
  }

  const handleVideoSelect = (video: Video, week: number) => {
    setSelectedVideo(video)
    setSelectedWeek(week)
    // Mark this topic as visited
    setCompletedTopics(prev => new Set(prev).add(week))
  }

  const getVideoNavigation = () => {
    if (!course || !selectedVideo) return { previousVideo: null, nextVideo: null }

    let allVideos: { video: Video; week: number }[] = []
    course.syllabus.forEach((week) => {
      week.videos.forEach((video) => {
        allVideos.push({ video, week: week.week })
      })
    })

    const currentIndex = allVideos.findIndex((v) => v.video.id === selectedVideo.id)
    const previousVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null
    const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null

    return { previousVideo, nextVideo }
  }

  const { previousVideo, nextVideo } = getVideoNavigation()

  // Calculate progress based on completed topics
  const calculateProgress = () => {
    if (!course || course.syllabus.length === 0) return 0
    const totalTopics = course.syllabus.length
    const completedCount = completedTopics.size
    // When course is completed, show 100%
    if (user?.completedCourses?.includes(numericCourseId || 0)) {
      return 100
    }
    // Otherwise calculate based on visited topics
    return Math.round((completedCount / totalTopics) * 100)
  }

  const progressPercentage = calculateProgress()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="h-4 w-4" /> },
    { id: "materials", label: "Materials", icon: <Download className="h-4 w-4" /> },
    { id: "assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "quiz", label: "Quiz", icon: <FileText className="h-4 w-4" /> },
    { id: "grades", label: "Grades", icon: <CheckCircle2 className="h-4 w-4" /> },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
      {/* Main Content - Video & Materials */}
      <div className="flex-1">
        {selectedVideo ? (
          <div className="space-y-3">
            {/* Video Player - Full width and height */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="relative bg-black w-full" style={{ aspectRatio: "16/9", minHeight: "500px" }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedVideo.url}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Video Title and Info */}
            <div>
              <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedVideo.duration}
                </Badge>
                <Badge variant="secondary">
                  Week {selectedWeek}
                </Badge>
                <Badge variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Beginner
                </Badge>
              </div>

              {/* Course Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedTopics.size}/{course.syllabus.length} modules completed
                  </span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex overflow-x-auto border-b border-border bg-muted/30">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary text-primary bg-transparent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">About this lesson</h3>
                      <p className="text-muted-foreground">
                        In this lesson, you&apos;ll learn the key concepts related to {selectedVideo.title.toLowerCase()}. 
                        Follow along with the video and try the exercises at the end to solidify your understanding.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key takeaways</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✓ Understand the core concepts</li>
                        <li>✓ Practice with real-world examples</li>
                        <li>✓ Complete the exercise section</li>
                        <li>✓ Move on to the next lesson</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Resources</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📄 Lesson notes (Coming soon)</li>
                        <li>📝 Exercises & assignments (Coming soon)</li>
                        <li>🔗 External resources (Coming soon)</li>
                        <li>💬 Discussion forum (Coming soon)</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "materials" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">No materials available for this lesson yet.</p>
                  </div>
                )}

                {activeTab === "assignments" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">No assignments available for this lesson yet.</p>
                  </div>
                )}

                {activeTab === "quiz" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">No quiz available for this lesson yet.</p>
                  </div>
                )}

                {activeTab === "grades" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">No grades available for this lesson yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="rounded-full"
                onClick={() => {
                  if (previousVideo) {
                    handleVideoSelect(previousVideo.video, previousVideo.week)
                  }
                }}
                disabled={!previousVideo}
              >
                ← Previous Lesson
              </Button>
              {nextVideo ? (
                <Button 
                  className="rounded-full ml-auto"
                  onClick={() => {
                    if (nextVideo) {
                      handleVideoSelect(nextVideo.video, nextVideo.week)
                    }
                  }}
                >
                  Next Lesson →
                </Button>
              ) : (
                <Button 
                  className="rounded-full ml-auto bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  onClick={() => {
                    console.log('Finish Course clicked', { user, numericCourseId, course: course?.title })
                    if (user && numericCourseId !== null && numericCourseId > 0 && course) {
                      console.log('Completing course', numericCourseId)
                      // Set progress to 100% and complete the course
                      updateCourseProgress(numericCourseId, 100)
                      completeCourse(numericCourseId)
                      // Store the completion data to display in modal
                      setCourseCompletedData({
                        streak: user.streak + 1, // Streak will increment
                        totalCompleted: user.completedCourses.length + 1,
                      })
                      // Log completion
                      console.log('Course completed successfully. Showing modal.')
                      // Show modal - user will click continue to go back
                      setShowCompletionModal(true)
                    } else {
                      console.log('Cannot complete course - missing data', { user: !!user, numericCourseId, course: !!course })
                    }
                  }}
                >
                  🎉 Finish Course
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Select a video to start learning</p>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {course && (
        <CourseCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            console.log('Modal closed, returning to previous page')
            setShowCompletionModal(false)
            setCourseCompletedData(null)
            onBack()
          }}
          courseTitle={course.title}
          streak={courseCompletedData?.streak ?? user?.streak ?? 0}
          totalCompleted={courseCompletedData?.totalCompleted ?? user?.completedCourses.length ?? 0}
        />
      )}

      {/* Sidebar - Syllabus (Right side - Wider) */}
      <div className="lg:w-96 shrink-0">
        <div className="glass-card rounded-2xl overflow-hidden sticky top-24 max-h-[calc(100vh-120px)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-3 w-full justify-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h3 className="font-semibold text-sm mb-1 truncate">{course.title}</h3>
            <p className="text-xs text-muted-foreground">{course.instructor}</p>
          </div>

          {/* Syllabus List */}
          <div className="overflow-y-auto flex-1">
            <div className="p-4 space-y-2">
              {course.syllabus.map((week) => (
                <div key={week.week} className="rounded-lg border border-border overflow-hidden">
                  {/* Week Header */}
                  <button
                    onClick={() => toggleWeek(week.week)}
                    className="w-full px-3 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left font-medium text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">Week {week.week}: {week.topic}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        expandedWeeks.has(week.week) ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Videos List */}
                  {expandedWeeks.has(week.week) && (
                    <div className="border-t border-border bg-muted/30 py-2">
                      {week.videos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => handleVideoSelect(video, week.week)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            selectedVideo?.id === video.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <Play className="h-3 w-3 shrink-0 fill-current" />
                          <span className="truncate flex-1">{video.title}</span>
                          <span className="text-xs shrink-0 opacity-70">{video.duration}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

