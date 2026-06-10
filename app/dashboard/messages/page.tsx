"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Send, Search, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Conversation {
  id: string
  otherName: string
  otherAvatar: string | null
  lastMessageAt: string | null
}

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations(id, last_message_at)")
      .eq("user_id", user.id)

    const convIds = (parts || []).map((p: any) => p.conversation_id)
    if (convIds.length === 0) {
      setConversations([])
      return
    }

    const { data: others } = await supabase
      .from("conversation_participants")
      .select("conversation_id, users(id, name, avatar, email)")
      .in("conversation_id", convIds)
      .neq("user_id", user.id)

    const convs: Conversation[] = convIds.map((id: string) => {
      const meta = (parts || []).find((p: any) => p.conversation_id === id) as any
      const other = (others || []).find((o: any) => o.conversation_id === id) as any
      const otherUser = other?.users
      return {
        id,
        otherName: otherUser?.name || otherUser?.email?.split("@")[0] || "Conversation",
        otherAvatar: otherUser?.avatar || null,
        lastMessageAt: meta?.conversations?.last_message_at || null,
      }
    })

    convs.sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""))
    setConversations(convs)
    if (!selectedId && convs.length > 0) setSelectedId(convs[0].id)
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Load messages for the selected conversation + subscribe to realtime inserts
  useEffect(() => {
    if (!selectedId) return
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true })
      if (active) setMessages(data || [])
    }
    load()

    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev
            return [...prev, payload.new as Message]
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [selectedId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedId || !user?.id) return
    const body = messageText.trim()
    setMessageText("")

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: selectedId, sender_id: user.id, body })
      .select("id, sender_id, body, created_at")
      .single()

    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedId)
    }
  }

  const filtered = conversations.filter((c) =>
    c.otherName.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Connect with instructors and classmates</p>
      </div>

      {!loading && conversations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No conversations yet</h3>
          <p className="text-muted-foreground mt-1">
            Conversations with your instructors and study groups will appear here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[600px] lg:h-[700px]">
          <div className="rounded-2xl border border-border flex flex-col bg-muted/30 lg:col-span-1">
            <div className="p-4 border-b border-border space-y-3">
              <h2 className="font-semibold">Conversations</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors flex items-start gap-3 ${
                      selectedId === conv.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                    }`}
                  >
                    {conv.otherAvatar ? (
                      <img src={conv.otherAvatar} alt={conv.otherName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                        {conv.otherName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{conv.otherName}</p>
                      {conv.lastMessageAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {selected && (
            <div className="rounded-2xl border border-border flex flex-col bg-muted/30 lg:col-span-2">
              <div className="p-4 border-b border-border flex items-center gap-3">
                {selected.otherAvatar ? (
                  <img src={selected.otherAvatar} alt={selected.otherName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {selected.otherName.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-semibold">{selected.otherName}</p>
              </div>

              <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <div
                            className={`rounded-2xl px-4 py-2 max-w-xs ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm">{msg.body}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="resize-none min-h-12 max-h-24"
                  />
                  <Button onClick={sendMessage} disabled={!messageText.trim()} className="h-12 px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
