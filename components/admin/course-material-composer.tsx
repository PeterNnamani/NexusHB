"use client"

import { useState } from "react"
import { Sparkles, Loader2, FileText, Link2, Eye, EyeOff, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type Props = {
  courseId: string
  onSaved: () => void
  compact?: boolean
}

export function CourseMaterialComposer({ courseId, onSaved, compact = false }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(!compact)
  const [mode, setMode] = useState<"text" | "link">("text")
  const [title, setTitle] = useState("")
  const [rawText, setRawText] = useState("")
  const [formatted, setFormatted] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [formatting, setFormatting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const formatWithAi = async () => {
    if (!rawText.trim()) {
      toast({ title: "Paste your notes first", variant: "destructive" })
      return
    }
    setFormatting(true)
    try {
      const res = await fetch("/api/admin/format-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, title: title || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Format failed")
      setFormatted(data.formatted || "")
      if (!title && data.title) setTitle(data.title)
      setShowPreview(true)
      toast({
        title: data.source === "ai" ? "Formatted with AI" : "Formatted",
        description: "Review preview, then save.",
      })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Format failed",
        variant: "destructive",
      })
    } finally {
      setFormatting(false)
    }
  }

  const saveMaterial = async () => {
    const materialTitle = title.trim()
    if (!materialTitle) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload =
        mode === "text"
          ? {
              courseId,
              title: materialTitle,
              content: formatted.trim() || rawText.trim(),
            }
          : {
              courseId,
              title: materialTitle,
              url: linkUrl.trim(),
              type: "link",
            }

      if (mode === "link" && !linkUrl.trim()) {
        throw new Error("URL is required for link materials")
      }
      if (mode === "text" && !(formatted.trim() || rawText.trim())) {
        throw new Error("Add notes or format text before saving")
      }

      const res = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")

      setTitle("")
      setRawText("")
      setFormatted("")
      setLinkUrl("")
      setShowPreview(false)
      toast({ title: "Material saved" })
      onSaved()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Save failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formBody = (
    <div className="space-y-3 pt-1">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "link")}>
        <TabsList className="grid h-8 w-full max-w-xs grid-cols-2">
          <TabsTrigger value="text" className="gap-1 text-xs h-7">
            <FileText className="h-3 w-3" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="link" className="gap-1 text-xs h-7">
            <Link2 className="h-3 w-3" />
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-2.5 mt-2.5">
          <Input
            placeholder="Title — e.g. Week 1 reading notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-sm"
          />
          <Textarea
            placeholder="Paste lesson notes or bullets…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={compact ? 4 : 5}
            className="font-mono text-xs resize-y min-h-[5rem]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={formatWithAi}
              disabled={formatting || !rawText.trim()}
              className="gap-1.5 h-8"
            >
              {formatting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI format
            </Button>
            {(formatted || rawText) && (
              <button
                type="button"
                className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                Preview
              </button>
            )}
          </div>
          {showPreview && (formatted || rawText) && (
            <pre className="rounded-md border bg-background/80 p-2.5 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto font-sans leading-relaxed">
              {formatted || rawText}
            </pre>
          )}
        </TabsContent>

        <TabsContent value="link" className="space-y-2.5 mt-2.5">
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              placeholder="Material title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={saveMaterial} disabled={saving} size="sm" className="h-8 gap-1.5">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Save material
      </Button>
    </div>
  )

  if (!compact) {
    return (
      <div className="rounded-lg border bg-card p-3.5 shadow-sm">{formBody}</div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 transition-colors">
        <span className="inline-flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-primary" />
          Add material
        </span>
        <span className="text-xs text-muted-foreground font-normal">
          {open ? "Hide" : "Expand"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{formBody}</CollapsibleContent>
    </Collapsible>
  )
}
