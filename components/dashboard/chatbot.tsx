"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, GraduationCap, Presentation, Sparkles } from "lucide-react"
import { NexusChatbotIcon } from "@/components/icons/nexus-chatbot-icon"
import { useAuth } from "@/contexts/auth-context"
import { useDashboard } from "@/contexts/dashboard-context"

type AssistantMode = "learning" | "teaching"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

const ASSISTANT_CONFIG = {
  learning: {
    title: "Nexus AI",
    subtitle: "Universal assistant · courses · live web",
    badge: "AI",
    icon: GraduationCap,
    greeting:
      "Hi! I'm Nexus AI — ask me anything in the world. I search the web for current facts, answer general knowledge questions, and also know your Nexus courses when you need study help.",
    intro:
      "Ask anything — homework, coding, news, advice — plus your enrolled courses.",
    placeholder: "Ask me anything…",
    suggestions: [
      "What's in the news today?",
      "Explain quantum computing simply",
      "Summarize my course curriculum",
    ],
  },
  teaching: {
    title: "Nexus AI",
    subtitle: "Universal assistant · teaching · live web",
    badge: "AI",
    icon: Presentation,
    greeting:
      "Hello! I'm Nexus AI — a full-capability assistant with live web access. Ask about anything: research, coding, trends, lesson ideas — or your Nexus courses and admin workflows.",
    intro:
      "General knowledge, web search, and course authoring — all in one.",
    placeholder: "Ask me anything…",
    suggestions: [
      "Latest trends in online education",
      "Draft lesson materials for Week 3",
      "Explain how transformers work",
    ],
  },
} as const

function resolveMode(
  dashboardRole: string,
  accountRole: string | undefined,
): AssistantMode {
  if (dashboardRole === "student") return "learning"
  if (dashboardRole === "tutor" || dashboardRole === "admin") return "teaching"
  if (accountRole === "tutor" || accountRole === "admin") {
    return "teaching"
  }
  return "learning"
}

function readActiveCourseId(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("courseId")
}

export function Chatbot() {
  const { user } = useAuth()
  const { currentRole } = useDashboard()
  const pathname = usePathname()
  const mode = useMemo(
    () => resolveMode(currentRole, user?.role),
    [currentRole, user?.role],
  )
  const config = ASSISTANT_CONFIG[mode]

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveCourseId(readActiveCourseId())
  }, [pathname])

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        content: config.greeting,
        role: "assistant",
        timestamp: new Date(),
      },
    ])
    setInput("")
  }, [mode, config.greeting])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(true)
      setTimeout(() => setShowIntro(false), 9000)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpen && showIntro) setShowIntro(false)
  }, [isOpen, showIntro])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          mode,
          userId: user?.id,
          userName: user?.name,
          activeCourseId,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const ModeIcon = config.icon

  return (
    <>
      {showIntro && !isOpen && (
        <div className="fixed bottom-36 right-5 z-[60] flex items-end gap-3 animate-in slide-in-from-bottom-4 duration-500 max-w-xs">
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-lg text-sm text-foreground relative">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Nexus AI
            </div>
            {config.intro}
            <div className="absolute -bottom-2 right-8 w-3 h-3 rotate-45 border-r border-b border-border bg-card" />
          </div>
          <NexusChatbotIcon className="h-16 w-16 drop-shadow-xl" pulse emphasized />
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-2">
        {!isOpen && (
          <span className="text-xs font-semibold tracking-wide text-primary-foreground bg-primary border border-primary/80 rounded-full px-3 py-1 shadow-md">
            Ask AI
          </span>
        )}
        {isOpen ? (
          <Button
            onClick={() => setIsOpen(false)}
            aria-label="Close AI chatbot"
            className="h-16 w-16 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground ring-4 ring-primary/20 hover:ring-primary/30 transition-all duration-300"
            size="icon"
          >
            <X className="h-7 w-7" />
          </Button>
        ) : (
          <div className="relative flex items-center justify-center">
            <span
              className="pointer-events-none absolute h-20 w-20 rounded-full bg-primary/25 animate-ping"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute h-[4.75rem] w-[4.75rem] rounded-full ring-4 ring-primary/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={`Open ${config.title}`}
              className="relative flex h-20 w-20 items-center justify-center bg-transparent transition-transform duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
            >
              <NexusChatbotIcon className="h-[4.25rem] w-[4.25rem] drop-shadow-2xl" pulse emphasized />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <Card className="fixed bottom-[5.75rem] right-5 w-[min(100vw-2.5rem,24rem)] h-[32rem] shadow-xl z-40 flex flex-col border-border overflow-hidden">
          <CardHeader className="pb-3 shrink-0 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <NexusChatbotIcon className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{config.title}</CardTitle>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    {config.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{config.subtitle}</p>
              </div>
              <ModeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 p-0 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-4 py-4 space-y-4">
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {config.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendMessage(s)}
                        className="text-xs rounded-full border border-border bg-muted/50 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <NexusChatbotIcon className="mr-2 mt-1 h-6 w-6 shrink-0" />
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <NexusChatbotIcon className="mr-2 mt-1 h-6 w-6 shrink-0" pulse />
                    <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                        </span>
                        <span className="text-muted-foreground">Thinking…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 p-3 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={config.placeholder}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
