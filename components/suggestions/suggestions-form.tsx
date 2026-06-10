"use client"

import { useState } from "react"
import { Loader2, Lightbulb, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const categories = [
  { value: "feature", label: "New Feature", description: "Suggest a new feature or functionality" },
  { value: "improvement", label: "Improvement", description: "Enhance an existing feature" },
  { value: "content", label: "Course Content", description: "Suggest new courses or topics" },
  { value: "ux", label: "User Experience", description: "Improve navigation or design" },
  { value: "other", label: "Other", description: "Something else entirely" },
]

export function SuggestionsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    title: "",
    description: "",
  })

  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          message: `${formData.title}\n\n${formData.description}`,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit suggestion")
      }
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit suggestion")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="glass-card rounded-2xl p-8 lg:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <ThumbsUp className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Your suggestion has been submitted. We review all feedback and 
          will reach out if we need more details.
        </p>
        <Button
          onClick={() => {
            setIsSubmitted(false)
            setFormData({
              name: "",
              email: "",
              category: "",
              title: "",
              description: "",
            })
          }}
          variant="outline"
          className="glass-button rounded-full"
        >
          Submit Another Suggestion
        </Button>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Share Your Idea</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name (Optional)</Label>
            <Input
              id="name"
              placeholder="John Doe"
              className="h-12"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-12"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll only use this to follow up on your suggestion
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Category</Label>
          <RadioGroup
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {categories.map((category) => (
              <label
                key={category.value}
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.category === category.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <RadioGroupItem value={category.value} id={category.value} />
                  <span className="font-medium text-sm">{category.label}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">
                  {category.description}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Suggestion Title</Label>
          <Input
            id="title"
            placeholder="A brief title for your suggestion"
            className="h-12"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your suggestion in detail. What problem does it solve? How would it work?"
            className="min-h-40 resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl"
          disabled={isSubmitting || !formData.category}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-5 w-5" />
              Submit Suggestion
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
