"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  BookOpen,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface EventRow {
  id: string
  title: string
  description: string | null
  type: string
  start_at: string
}

export default function SchedulePage() {
  const { user } = useAuth()
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [events, setEvents] = useState<EventRow[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ title: "", type: "event", date: "", time: "" })

  const loadEvents = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from("events")
      .select("id, title, description, type, start_at")
      .eq("user_id", user.id)
      .order("start_at", { ascending: true })
    setEvents(data || [])
  }, [user?.id])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const days = getDaysInMonth(currentDate)

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    return events.filter((event) => {
      const d = new Date(event.start_at)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    })
  }

  const hasEvents = (date: Date | null) => (date ? getEventsForDate(date).length > 0 : false)
  const isToday = (date: Date | null) => (date ? date.toDateString() === today.toDateString() : false)
  const isSelected = (date: Date | null) => (date ? date.toDateString() === selectedDate.toDateString() : false)

  const selectedEvents = getEventsForDate(selectedDate)
  const upcoming = events.filter((e) => new Date(e.start_at) >= today).slice(0, 5)
  const deadlines = events.filter((e) => e.type === "deadline" && new Date(e.start_at) >= today)

  const getEventIcon = (type: string) => (type === "live" ? Video : type === "deadline" ? CalendarIcon : BookOpen)
  const getEventColor = (type: string) =>
    type === "live"
      ? "bg-red-500/10 text-red-500"
      : type === "deadline"
        ? "bg-amber-500/10 text-amber-500"
        : "bg-primary/10 text-primary"

  const addEvent = async () => {
    if (!form.title.trim() || !form.date || !user?.id) return
    const startAt = new Date(`${form.date}T${form.time || "09:00"}`)
    await supabase.from("events").insert({
      user_id: user.id,
      title: form.title,
      type: form.type,
      start_at: startAt.toISOString(),
    })
    setIsOpen(false)
    setForm({ title: "", type: "event", date: "", time: "" })
    loadEvents()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage your learning schedule and upcoming events</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>
              ))}
            </div>

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
                    !date && "invisible",
                  )}
                >
                  {date && (
                    <>
                      <span className="text-sm">{date.getDate()}</span>
                      {hasEvents(date) && (
                        <span className={cn(
                          "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                          isSelected(date) ? "bg-primary-foreground" : "bg-primary",
                        )} />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

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
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(event.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <Badge variant="outline" className="ml-2 capitalize">{event.type}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No events scheduled for this day</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule a Session
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((event) => {
                  const Icon = getEventIcon(event.type)
                  return (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", getEventColor(event.type))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                          {new Date(event.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            {deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines.</p>
            ) : (
              <div className="space-y-3">
                {deadlines.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{d.title}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {new Date(d.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2" placeholder="Event title" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Study session</SelectItem>
                  <SelectItem value="live">Live session</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-2" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={addEvent} className="flex-1">Add Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
