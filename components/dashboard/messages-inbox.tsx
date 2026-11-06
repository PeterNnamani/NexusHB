"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { Loader2, MessageSquare, MessageSquarePlus, RotateCw, Search, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"

type Profile = {
  id: string
  name: string
  avatar: string | null
}

type Conversation = {
  other: Profile
  lastMessage: string
  lastMessageAt: string | null
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  created_at: string
  read: boolean
  sender?: Profile
  receiver?: Profile
  status?: "sending" | "failed"
  error?: string
}

type ConversationListResponse = { conversations: Conversation[]; error?: string }
type ConversationResponse = { other: Profile; messages: Message[]; error?: string }
type RecipientResponse = { other: Profile; error?: string }
type SendResponse = { message: Message; error?: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function messageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  if (isToday(date)) return format(date, "h:mm a")
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d, h:mm a")
}

function Avatar({ profile, size = "h-9 w-9" }: { profile: Profile; size?: string }) {
  return profile.avatar ? (
    <img
      src={profile.avatar}
      alt={profile.name}
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      aria-label={profile.name}
      className={`${size} shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold`}
    >
      {profile.name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function MessagesInbox() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState("")
  const [listRetry, setListRetry] = useState(0)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [conversationError, setConversationError] = useState("")
  const [conversationRetry, setConversationRetry] = useState(0)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientError, setRecipientError] = useState("")
  const [lookingUpRecipient, setLookingUpRecipient] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isAtBottom = useRef(true)
  const seenMessageIds = useRef(new Set<string>())
  const pendingMessages = useRef(new Map<string, Message>())
  const selectedIdRef = useRef<string | null>(selectedId)
  selectedIdRef.current = selectedId

  useEffect(() => {
    if (!user?.id) return
    let active = true
    setLoadingList(true)
    setListError("")

    fetch("/api/messages", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as ConversationListResponse
        if (!response.ok) throw new Error(result.error || "Could not load conversations")
        return result
      })
      .then((result) => {
        if (!active) return
        const loadedConversations = result.conversations || []
        setConversations(loadedConversations)
        const requestedId = new URLSearchParams(window.location.search).get("with")
        if (requestedId && UUID_PATTERN.test(requestedId) && requestedId !== user.id) {
          setSelectedId(requestedId)
          setSelectedProfile(
            loadedConversations.find((conversation) => conversation.other.id === requestedId)?.other || null,
          )
        } else if (loadedConversations.length > 0) {
          setSelectedId(loadedConversations[0].other.id)
          setSelectedProfile(loadedConversations[0].other)
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        setListError(error instanceof Error ? error.message : "Could not load conversations")
      })
      .finally(() => {
        if (active) setLoadingList(false)
      })

    return () => {
      active = false
    }
  }, [user?.id, listRetry])

  useEffect(() => {
    if (!selectedId || !user?.id) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let firstLoad = true
    isAtBottom.current = true
    seenMessageIds.current = new Set()
    setNewMessageCount(0)
    setMessages([])
    setConversationError("")
    setLoadingConversation(true)

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages?with=${encodeURIComponent(selectedId)}`, {
          cache: "no-store",
        })
        const result = (await response.json()) as ConversationResponse
        if (!response.ok) throw new Error(result.error || "Could not load messages")
        if (!active) return

        const incoming = result.messages || []
        const incomingIds = new Set(incoming.map((message) => message.id))
        incoming.forEach((message) => pendingMessages.current.delete(message.id))
        const pendingForConversation = [...pendingMessages.current.values()].filter(
          (message) => message.receiver_id === selectedId,
        )
        if (!firstLoad) {
          const newIncomingCount = incoming.filter(
            (message) =>
              message.sender_id !== user.id && !seenMessageIds.current.has(message.id),
          ).length
          if (newIncomingCount > 0 && !isAtBottom.current) {
            setNewMessageCount((count) => count + newIncomingCount)
          }
        }
        incoming.forEach((message) => seenMessageIds.current.add(message.id))
        setSelectedProfile(result.other)
        setConversations((current) => {
          const existing = current.find((conversation) => conversation.other.id === selectedId)
          const latest = incoming[incoming.length - 1]
          const updated: Conversation = {
            other: result.other,
            lastMessage: latest?.text || existing?.lastMessage || "",
            lastMessageAt: latest?.created_at || existing?.lastMessageAt || null,
          }
          return [updated, ...current.filter((conversation) => conversation.other.id !== selectedId)]
            .sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""))
        })
        setMessages((current) => {
          const localOnly = pendingForConversation.filter((message) => !incomingIds.has(message.id))
          return [...incoming, ...localOnly].sort((a, b) =>
            a.created_at.localeCompare(b.created_at),
          )
        })
        setConversationError("")
        firstLoad = false
      } catch (error) {
        if (active) {
          setConversationError(error instanceof Error ? error.message : "Could not load messages")
        }
      } finally {
        if (active) {
          if (firstLoad) setLoadingConversation(false)
          timer = setTimeout(loadMessages, 3000)
        }
      }
    }

    void loadMessages()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [selectedId, user?.id, conversationRetry])

  useEffect(() => {
    const container = scrollRef.current
    if (container && isAtBottom.current) {
      container.scrollTop = container.scrollHeight
      setNewMessageCount(0)
    }
  }, [messages])

  const startConversation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = recipientEmail.trim()
    if (!email) return
    setLookingUpRecipient(true)
    setRecipientError("")

    try {
      const response = await fetch(`/api/messages?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      })
      const result = (await response.json()) as RecipientResponse
      if (!response.ok) throw new Error(result.error || "Could not find that account")

      const profile = result.other
      setConversations((current) => {
        if (current.some((conversation) => conversation.other.id === profile.id)) return current
        return [{ other: profile, lastMessage: "", lastMessageAt: null }, ...current]
      })
      setSelectedProfile(profile)
      setSelectedId(profile.id)
      setRecipientEmail("")
      setNewMessageOpen(false)
    } catch (error) {
      setRecipientError(error instanceof Error ? error.message : "Could not find that account")
    } finally {
      setLookingUpRecipient(false)
    }
  }

  const deliverMessage = useCallback(
    async (id: string, text: string, receiverId: string) => {
      if (!user?.id) return
      const pending = pendingMessages.current.get(id)
      if (pending) {
        pendingMessages.current.set(id, { ...pending, status: "sending", error: undefined })
      }
      if (selectedIdRef.current === receiverId) {
        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, status: "sending" } : message)),
        )
      }

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, receiverId, text }),
        })
        const result = (await response.json()) as SendResponse
        if (!response.ok) throw new Error(result.error || "Could not send message")

        const sentMessage = result.message
        pendingMessages.current.delete(id)
        if (selectedIdRef.current === receiverId) {
          setMessages((current) =>
            [...current.filter((message) => message.id !== id && message.id !== sentMessage.id), sentMessage]
              .sort((a, b) => a.created_at.localeCompare(b.created_at)),
          )
        }
        setConversations((current) => {
          const other = sentMessage.sender_id === user.id ? sentMessage.receiver : sentMessage.sender
          if (!other) return current
          const updated: Conversation = {
            other,
            lastMessage: sentMessage.text,
            lastMessageAt: sentMessage.created_at,
          }
          return [updated, ...current.filter((conversation) => conversation.other.id !== receiverId)]
            .sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""))
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Could not send message"
        const pendingMessage = pendingMessages.current.get(id)
        if (pendingMessage) {
          pendingMessages.current.set(id, {
            ...pendingMessage,
            status: "failed",
            error: errorMessage,
          })
          if (selectedIdRef.current === receiverId) {
            setMessages((current) =>
              current.map((message) =>
                message.id === id
                  ? { ...message, status: "failed", error: errorMessage }
                  : message,
              ),
            )
          }
        }
      }
    },
    [user?.id],
  )

  const sendMessage = async () => {
    const text = messageText.trim()
    if (!text || !selectedId || !user?.id || !selectedProfile) return

    const id = crypto.randomUUID()
    const optimistic: Message = {
      id,
      sender_id: user.id,
      receiver_id: selectedId,
      text,
      created_at: new Date().toISOString(),
      read: false,
      sender: {
        id: user.id,
        name: user.name || "You",
        avatar: user.avatar || null,
      },
      receiver: selectedProfile,
      status: "sending",
    }
    pendingMessages.current.set(id, optimistic)
    isAtBottom.current = true
    setNewMessageCount(0)
    setMessages((current) => [...current, optimistic])
    setMessageText("")
    textareaRef.current?.focus()
    void deliverMessage(id, text, selectedId)
  }

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 48
    isAtBottom.current = atBottom
    if (atBottom) setNewMessageCount(0)
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.other.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-1 text-muted-foreground">Connect with instructors and classmates</p>
        </div>
        <Button
          type="button"
          variant={newMessageOpen ? "outline" : "default"}
          onClick={() => {
            setNewMessageOpen((open) => !open)
            setRecipientError("")
          }}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {newMessageOpen ? "Cancel" : "New message"}
        </Button>
      </div>

      {newMessageOpen && (
        <form
          onSubmit={startConversation}
          className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="message-recipient" className="mb-1.5 block text-sm font-medium">
              Start a conversation by email
            </label>
            <Input
              id="message-recipient"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              aria-invalid={Boolean(recipientError)}
              aria-describedby={recipientError ? "message-recipient-error" : undefined}
              maxLength={320}
              required
            />
            {recipientError && (
              <p id="message-recipient-error" role="alert" className="mt-1 text-sm text-destructive">
                {recipientError}
              </p>
            )}
          </div>
          <Button type="submit" className="self-end" disabled={!recipientEmail.trim() || lookingUpRecipient}>
            {lookingUpRecipient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Open conversation
          </Button>
        </form>
      )}

      <div className="grid h-[min(760px,calc(100dvh-16rem))] min-h-[520px] grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-muted/20">
          <div className="space-y-3 border-b border-border p-4">
            <h2 className="font-semibold">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="bg-background pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <div className="space-y-3 p-2" aria-label="Loading conversations">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex animate-pulse items-center gap-3 p-2">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listError ? (
              <div className="space-y-3 p-3 text-sm" role="alert">
                <p className="text-destructive">{listError}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => setListRetry((n) => n + 1)}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {conversations.length > 0 ? "No matching conversations." : "No messages yet — say hi"}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => {
                  const active = selectedId === conversation.other.id
                  return (
                    <button
                      key={conversation.other.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfile(conversation.other)
                        setSelectedId(conversation.other.id)
                      }}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                        active ? "border border-primary/30 bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <Avatar profile={conversation.other} size="h-10 w-10" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{conversation.other.name}</span>
                          {conversation.lastMessageAt && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {messageTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {conversation.lastMessage || "No messages yet"}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 lg:col-span-2">
          {selectedId && selectedProfile ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <Avatar profile={selectedProfile} size="h-10 w-10" />
                <h2 className="font-semibold">{selectedProfile.name}</h2>
              </div>

              <div className="relative min-h-0 flex-1">
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="h-full overflow-y-auto p-4"
                  aria-label={`Messages with ${selectedProfile.name}`}
                  aria-live="polite"
                >
                  {loadingConversation ? (
                    <div className="space-y-5" aria-label="Loading messages">
                      {Array.from({ length: 4 }, (_, index) => (
                        <div
                          key={index}
                          className={`flex animate-pulse items-end gap-2 ${index % 2 ? "justify-end" : ""}`}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted" />
                          <div className={`h-12 w-48 rounded-2xl bg-muted ${index % 2 ? "w-40" : ""}`} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 && !conversationError ? (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                      <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/60" />
                      <p className="font-medium">No messages yet — say hi</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Send a message to start the conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {messages.map((message, index) => {
                        const own = message.sender_id === user?.id
                        const previous = messages[index - 1]
                        const groupStart = !previous || previous.sender_id !== message.sender_id
                        const sender =
                          message.sender ||
                          (own
                            ? { id: user?.id || "", name: user?.name || "You", avatar: user?.avatar || null }
                            : selectedProfile)
                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"} ${
                              groupStart ? "mt-4 first:mt-0" : "mt-1"
                            }`}
                          >
                            {!own && (
                              groupStart ? (
                                <Avatar profile={sender} size="h-8 w-8" />
                              ) : (
                                <span className="w-8 shrink-0" />
                              )
                            )}
                            <div className={`flex max-w-[82%] flex-col ${own ? "items-end" : "items-start"}`}>
                              {groupStart && (
                                <span className="mb-1 px-1 text-xs text-muted-foreground">
                                  {own ? `${sender.name} · You` : sender.name}
                                </span>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  own
                                    ? "rounded-br-sm bg-primary text-primary-foreground"
                                    : "rounded-bl-sm bg-background text-foreground"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                              </div>
                              <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                                <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
                                {message.status === "sending" && <span>Sending…</span>}
                                {message.status === "failed" && (
                                  <>
                                    <span className="text-destructive">{message.error || "Failed to send"}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void deliverMessage(message.id, message.text, message.receiver_id)
                                      }
                                      className="font-medium text-primary underline underline-offset-2"
                                    >
                                      Retry
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {own &&
                              (groupStart ? (
                                <Avatar profile={sender} size="h-8 w-8" />
                              ) : (
                                <span className="w-8 shrink-0" />
                              ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {conversationError && (
                    <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-background p-3 text-sm">
                      <p role="alert" className="text-destructive">{conversationError}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConversationRetry((count) => count + 1)}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
                {newMessageCount > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
                    onClick={() => {
                      const container = scrollRef.current
                      if (container) container.scrollTop = container.scrollHeight
                      isAtBottom.current = true
                      setNewMessageCount(0)
                    }}
                  >
                    {newMessageCount} new {newMessageCount === 1 ? "message" : "messages"}
                  </Button>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
                className="flex items-end gap-2 border-t border-border p-4"
              >
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  maxLength={5000}
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      void sendMessage()
                    }
                  }}
                  className="max-h-32 min-h-12 resize-y bg-background"
                  aria-label="Message"
                />
                <Button
                  type="submit"
                  onMouseDown={(event) => event.preventDefault()}
                  disabled={!messageText.trim()}
                  className="h-12 shrink-0 px-4"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/60" />
              <h2 className="font-semibold">Your messages</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a conversation or start a new one by email.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
