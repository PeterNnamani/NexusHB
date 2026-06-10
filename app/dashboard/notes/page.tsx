"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Trash2, Pencil, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: "", content: "" })

  const loadNotes = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from("notes")
      .select("id, title, content, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: "", content: "" })
    setIsOpen(true)
  }

  const openEdit = (note: Note) => {
    setEditing(note)
    setForm({ title: note.title, content: note.content })
    setIsOpen(true)
  }

  const saveNote = async () => {
    if (!form.title.trim() || !user?.id) return

    if (editing) {
      const { error } = await supabase
        .from("notes")
        .update({ title: form.title, content: form.content })
        .eq("id", editing.id)
      if (error) {
        toast({ title: "Error", description: "Could not save note", variant: "destructive" })
        return
      }
    } else {
      const { error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title: form.title, content: form.content })
      if (error) {
        toast({ title: "Error", description: "Could not create note", variant: "destructive" })
        return
      }
    }
    setIsOpen(false)
    setForm({ title: "", content: "" })
    setEditing(null)
    loadNotes()
  }

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-1">Keep track of important concepts from your courses</p>
        </div>
        <Button className="rounded-full gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading notes...</p>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No notes found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? "Try adjusting your search criteria" : "Create your first note to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-border p-5 space-y-3 hover:border-primary/50 transition-colors group"
            >
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{note.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(note)} title="Edit">
                    <Pencil className="h-3 w-3" />
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Note" : "Create New Note"}</DialogTitle>
            <DialogDescription>Organize your study materials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Note title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Note content..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="mt-2 min-h-32"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveNote} className="flex-1">
                {editing ? "Save Changes" : "Create Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
