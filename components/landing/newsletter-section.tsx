"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteNavLink } from "@/components/site/site-nav-link"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Subscription failed")
      }
      const data = await res.json().catch(() => ({}))
      setStatus("success")
      setMessage(
        data.alreadySubscribed
          ? "You're already on our list — thanks!"
          : "Thanks for subscribing!",
      )
      setEmail("")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Subscription failed")
    }
  }

  return (
    <section className="py-16 lg:py-24 bg-muted/30 border-t border-border/60">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 lg:p-10 shadow-sm text-center">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-primary">
            Stay updated
          </span>
          <h2 className="mb-3 text-2xl font-bold text-balance sm:text-3xl">
            Course launches &amp; earning tips in your inbox
          </h2>
          <p className="mb-6 text-muted-foreground">
            One email when it matters — no spam.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="submit"
              className="h-11 rounded-full px-6 font-semibold"
              disabled={status === "loading"}
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
            </Button>
          </form>

          {message && (
            <p className={`mt-3 text-sm ${status === "error" ? "text-destructive" : "text-primary"}`}>
              {message}
            </p>
          )}

          <div className="mt-8 border-t border-border/60 pt-6">
            <p className="text-sm text-muted-foreground mb-3">Ready to start learning?</p>
            <SiteNavLink href="/signup">
              <Button size="lg" className="rounded-full px-8 font-semibold shadow-sm group">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </SiteNavLink>
          </div>
        </div>
      </div>
    </section>
  )
}
