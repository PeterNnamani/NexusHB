"use client"

import { useState } from "react"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Video,
  BookOpen,
  Users,
  Bell,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const scheduledEvents = [
  {
    id: 1,
    title: "React Hooks Deep Dive",
    type: "lesson",
    time: "09:00 AM",
    duration: "1h 30m",
    date: new Date(2024, 2, 18),
    instructor: "Michael Torres",
    reminder: true,
  },
  {
    id: 2,
    title: "Live Q&A Session",
    type: "live",
    time: "02:00 PM",
    duration: "1h",
    date: new Date(2024, 2, 18),
    instructor: "Dr. Sarah Chen",
    reminder: true,
  },
  {
    id: 3,
    title: "Group Study: Node.js",
    type: "group",
    time: "04:00 PM",
    duration: "2h",
    date: new Date(2024, 2, 19),
    instructor: "Study Group",
    reminder: false,
  },
  {
    id: 4,
    title: "TypeScript Fundamentals",
    type: "lesson",
    time: "10:00 AM",
    duration: "45m",
    date: new Date(2024, 2, 20),
    instructor: "Dr. Sarah Chen",
    reminder: true,
  },
  {
    id: 5,
    title: "Project Review Meeting",
    type: "live",
    time: "03:00 PM",
    duration: "1h",
    date: new Date(2024, 2, 21),
    instructor: "Emily Watson",
    reminder: false,
  },
]

const upcomingDeadlines = [
  { id: 1, title: "React Project Submission", date: "Mar 20, 2024", course: "Advanced React" },
  { id: 2, title: "TypeScript Quiz", date: "Mar 22, 2024", course: "TypeScript Deep Dive" },
  { id: 3, title: "Node.js Assignment", date: "Mar 25, 2024", course: "Backend Mastery" },
]

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 18))
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 2, 18))

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const days = getDaysInMonth(currentDate)

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    return scheduledEvents.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    )
  }

  const hasEvents = (date: Date | null) => {
    return date ? getEventsForDate(date).length > 0 : false
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date(2024, 2, 18) // Simulated today
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const selectedEvents = getEventsForDate(selectedDate)

  const getEventIcon = (type: string) => {
    switch (type) {
      case "lesson": return BookOpen
      case "live": return Video
      case "group": return Users
      default: return CalendarIcon
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "lesson": return "bg-primary/10 text-primary"
      case "live": return "bg-red-500/10 text-red-500"
      case "group": return "bg-amber-500/10 text-amber-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage your learning schedule and upcoming events
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  disabled={!date}
                  className={cn(
                    "aspect-square p-1 rounded-xl transition-all relative",
                    date && "hover:bg-muted",
                    isToday(date) && "bg-primary/10",
                    isSelected(date) && "bg-primary text-primary-foreground",
                    !date && "invisible"
                  )}
                >
                  {date && (
                    <>
                      <span className="text-sm">{date.getDate()}</span>
                      {hasEvents(date) && (
                        <span className={cn(
                          "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                          isSelected(date) ? "bg-primary-foreground" : "bg-primary"
                        )} />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Day Events */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>

            {selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map((event) => {
                  const Icon = getEventIcon(event.type)
                  return (
                    <div key={event.id} className="flex gap-4 p-4 rounded-xl bg-muted/50">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", getEventColor(event.type))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.instructor}</p>
                          </div>
                          {event.reminder && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="h-3 w-3 mr-1" />
                              Reminder
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </span>
                          <span>{event.duration}</span>
                        </div>
                      </div>
                      <Button size="sm">Join</Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events scheduled for this day</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule a Session
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {scheduledEvents.slice(0, 4).map((event) => {
                const Icon = getEventIcon(event.type)
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", getEventColor(event.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {event.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Deadlines */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">{deadline.course}</p>
                    <p className="text-xs text-red-500 mt-1">{deadline.date}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">This Week</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scheduled Sessions</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Study Hours</span>
                <span className="font-semibold">12h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deadlines</span>
                <span className="font-semibold text-red-500">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
