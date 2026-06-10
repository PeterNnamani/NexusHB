"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, invalidateAdminFetch } from "@/lib/admin-fetch"

interface NewsItem {
  id: string
  title: string
  category: string | null
  published: boolean
  published_at: string | null
}

const emptyForm = { title: "", excerpt: "", content: "", category: "", image: "" }

export function AdminNews() {
  const { toast } = useToast()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ news: NewsItem[] }>("/api/admin/news")
      setNews(data.news || [])
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to load news",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const createNews = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Publish failed")
      setForm(emptyForm)
      toast({ title: "Article published" })
      load()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Publish failed",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (item: NewsItem) => {
    try {
      const res = await fetch("/api/admin/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, published: !item.published }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Update failed")
      }
      load()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Update failed",
        variant: "destructive",
      })
    }
  }

  const deleteNews = async (id: string) => {
    if (!window.confirm("Delete this article?")) return
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      toast({ title: "Article deleted" })
      load()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Publish an article</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <Textarea className="sm:col-span-2" placeholder="Excerpt (short summary)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <Textarea className="sm:col-span-2 min-h-40" placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <Button onClick={createNews} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Publish Article
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Articles ({news.length})</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : news.length === 0 ? (
          <p className="text-muted-foreground">No articles yet.</p>
        ) : (
          news.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <Badge variant={item.published ? "default" : "outline"}>
                      {item.published ? "Published" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-base text-muted-foreground">{item.category || "Uncategorized"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(item)}>
                    {item.published ? "Hide" : "Publish"}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNews(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
