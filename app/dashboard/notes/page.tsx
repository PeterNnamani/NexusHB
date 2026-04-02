"use client"

import { useState } from "react"
import { Plus, Search, Trash2, Archive, Tag, Share2, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Note {
  id: string
  title: string
  content: string
  course: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isLocked: boolean
  isFavorite: boolean
  isArchived: boolean
}

const sampleNotes: Note[] = [
  {
    id: "1",
    title: "CSS Grid Layout Basics",
    content: "CSS Grid is a powerful layout system in CSS. Key concepts: grid container, grid items, grid lines, tracks, cells, and areas.",
    course: "Complete Web Development Bootcamp",
    tags: ["CSS", "Layout", "Web Development"],
    createdAt: "2026-03-10",
    updatedAt: "2026-03-15",
    isLocked: false,
    isFavorite: true,
    isArchived: false,
  },
  {
    id: "2",
    title: "React Hooks Deep Dive",
    content: "useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef are the most common hooks.",
    course: "React & Next.js Masterclass",
    tags: ["React", "Hooks", "JavaScript"],
    createdAt: "2026-03-05",
    updatedAt: "2026-03-14",
    isLocked: false,
    isFavorite: false,
    isArchived: false,
  },
  {
    id: "3",
    title: "TypeScript Generics",
    content: "Generics allow us to create reusable components. They are useful when working with multiple types.",
    course: "TypeScript Complete Course",
    tags: ["TypeScript", "Advanced"],
    createdAt: "2026-02-28",
    updatedAt: "2026-03-12",
    isLocked: true,
    isFavorite: false,
    isArchived: false,
  },
  {
    id: "4",
    title: "Database Design Patterns",
    content: "Normalization, denormalization, indexing, and query optimization are key database design patterns.",
    course: "Database Design & SQL",
    tags: ["Database", "SQL"],
    createdAt: "2026-03-01",
    updatedAt: "2026-03-11",
    isLocked: false,
    isFavorite: false,
    isArchived: false,
  },
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(sampleNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [filterArchived, setFilterArchived] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", content: "", course: "" })
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)))

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || note.tags.includes(selectedTag)
    const matchesArchive = filterArchived ? note.isArchived : !note.isArchived
    return matchesSearch && matchesTag && matchesArchive
  })

  const createNote = () => {
    if (newNote.title.trim()) {
      const note: Note = {
        id: Math.random().toString(),
        title: newNote.title,
        content: newNote.content,
        course: newNote.course,
        tags: [],
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        isLocked: false,
        isFavorite: false,
        isArchived: false,
      }
      setNotes([note, ...notes])
      setNewNote({ title: "", content: "", course: "" })
      setIsCreateOpen(false)
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const toggleFavorite = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
      )
    )
  }

  const toggleArchive = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isArchived: !note.isArchived } : note
      )
    )
  }

  const toggleLock = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isLocked: !note.isLocked } : note
      )
    )
  }

  const favoriteNotes = notes.filter((n) => n.isFavorite && !n.isArchived)
  const activeNotes = notes.filter((n) => !n.isArchived)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Keep track of important concepts from your courses
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Add a new note to organize your study materials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Course (optional)</label>
                <Input
                  placeholder="Course name..."
                  value={newNote.course}
                  onChange={(e) =>
                    setNewNote({ ...newNote, course: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Note content..."
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  className="mt-2 min-h-32"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={createNote} className="flex-1">
                  Create Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant={filterArchived ? "default" : "outline"}
            onClick={() => setFilterArchived(!filterArchived)}
          >
            {filterArchived ? "Show Active" : "Show Archived"}
          </Button>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              All Notes
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Notes ({activeNotes.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites ({favoriteNotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No notes found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Create your first note to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-border p-5 space-y-3 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {note.title}
                        </h3>
                        {note.isLocked && (
                          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {note.course && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.course}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleFavorite(note.id)}
                    >
                      <Tag
                        className={`h-4 w-4 ${
                          note.isFavorite
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Updated {note.updatedAt}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleLock(note.id)}
                        title={note.isLocked ? "Unlock" : "Lock"}
                      >
                        {note.isLocked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleArchive(note.id)}
                        title="Archive"
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteNote(note.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {favoriteNotes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No favorite notes yet</h3>
              <p className="text-muted-foreground mt-1">
                Click the tag icon on a note to add it to favorites
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoriteNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 text-primary">
                        {note.title}
                      </h3>
                      {note.course && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.course}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-primary/20">
                    <span>Updated {note.updatedAt}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleFavorite(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
