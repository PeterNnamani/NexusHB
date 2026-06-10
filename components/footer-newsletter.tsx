"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FooterNewsletter() {
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
          ? "You're already subscribed!"
          : "Thanks for subscribing!",
      )
      setEmail("")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Subscription failed")
    }
  }

  return (
    <div className="w-full lg:max-w-md lg:ml-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="h-11 flex-1 rounded-full border-0 bg-white px-5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-11 shrink-0 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </Button>
      </form>
      {message && (
        <p
          className={`mt-2 text-xs ${status === "error" ? "text-red-300" : "text-emerald-200"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  )
}
