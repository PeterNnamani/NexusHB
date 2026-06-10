"use client"

import { useEffect, useState, useCallback } from "react"
import { Mail, Lightbulb, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { adminFetch } from "@/lib/admin-fetch"

interface Contact {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  created_at: string
}

interface Suggestion {
  id: string
  name: string | null
  email: string | null
  category: string | null
  message: string
  created_at: string
}

export function AdminSubmissions() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ contacts: Contact[]; suggestions: Suggestion[] }>(
        "/api/admin/submissions",
      )
      setContacts(data.contacts || [])
      setSuggestions(data.suggestions || [])
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to load submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact Messages ({contacts.length})
        </h2>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground">No contact submissions yet.</p>
        ) : (
          contacts.map((c) => (
            <Card key={c.id} className="rounded-2xl">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <span className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-base text-muted-foreground">{c.email}{c.subject ? ` • ${c.subject}` : ""}</p>
                <p className="text-base mt-2 whitespace-pre-wrap">{c.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Suggestions ({suggestions.length})
        </h2>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground">No suggestions yet.</p>
        ) : (
          suggestions.map((s) => (
            <Card key={s.id} className="rounded-2xl">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{s.name || "Anonymous"}</p>
                  <span className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  {s.email && <span>{s.email}</span>}
                  {s.category && <Badge variant="secondary">{s.category}</Badge>}
                </div>
                <p className="text-base mt-2 whitespace-pre-wrap">{s.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
