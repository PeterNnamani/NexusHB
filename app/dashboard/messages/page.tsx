"use client"

import { useState } from "react"
import { Send, Search, Paperclip, MoreVertical, Smile, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isOwn: boolean
  attachment?: string
}

interface Conversation {
  id: string
  participantName: string
  participantAvatar: string
  participantRole: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
  messages: Message[]
}

const sampleConversations: Conversation[] = [
  {
    id: "1",
    participantName: "Dr. Angela Yu",
    participantAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    participantRole: "Course Instructor",
    lastMessage: "Great assignment! Here's my feedback...",
    lastMessageTime: "2 hours ago",
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: "m1",
        senderId: "instructor1",
        senderName: "Dr. Angela Yu",
        senderAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        content: "Hi! How are you progressing with the CSS Grid lesson?",
        timestamp: "2:30 PM",
        isOwn: false,
      },
      {
        id: "m2",
        senderId: "student",
        senderName: "You",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        content: "Great! I'm on the advanced layouts section now",
        timestamp: "2:45 PM",
        isOwn: true,
      },
      {
        id: "m3",
        senderId: "instructor1",
        senderName: "Dr. Angela Yu",
        senderAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        content: "Great assignment! Here's my feedback on your project...",
        timestamp: "4:15 PM",
        isOwn: false,
      },
    ],
  },
  {
    id: "2",
    participantName: "Sarah Chen",
    participantAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    participantRole: "Study Group Member",
    lastMessage: "See you tomorrow at 5 PM!",
    lastMessageTime: "1 day ago",
    unreadCount: 2,
    isOnline: false,
    messages: [
      {
        id: "m1",
        senderId: "group1",
        senderName: "Sarah Chen",
        senderAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        content: "Are you free tomorrow to study?",
        timestamp: "Yesterday",
        isOwn: false,
      },
      {
        id: "m2",
        senderId: "student",
        senderName: "You",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        content: "Yes! What time?",
        timestamp: "Yesterday",
        isOwn: true,
      },
      {
        id: "m3",
        senderId: "group1",
        senderName: "Sarah Chen",
        senderAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        content: "See you tomorrow at 5 PM!",
        timestamp: "Yesterday",
        isOwn: false,
      },
    ],
  },
  {
    id: "3",
    participantName: "Support Team",
    participantAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    participantRole: "Platform Support",
    lastMessage: "Your issue has been resolved",
    lastMessageTime: "3 days ago",
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: "m1",
        senderId: "support",
        senderName: "Support Team",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        content: "We're here to help! What can we assist you with?",
        timestamp: "3 days ago",
        isOwn: false,
      },
      {
        id: "m2",
        senderId: "student",
        senderName: "You",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        content: "I'm having trouble accessing a course",
        timestamp: "3 days ago",
        isOwn: true,
      },
      {
        id: "m3",
        senderId: "support",
        senderName: "Support Team",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        content: "Your issue has been resolved. Please try again!",
        timestamp: "3 days ago",
        isOwn: false,
      },
    ],
  },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState(sampleConversations)
  const [selectedConversationId, setSelectedConversationId] = useState(
    conversations[0]?.id
  )
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  )

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participantName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Math.random().toString(),
              senderId: "student",
              senderName: "You",
              senderAvatar:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
              content: messageText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isOwn: true,
            },
          ],
          lastMessage: messageText,
          lastMessageTime: "Just now",
        }
      }
      return conv
    })
    setConversations(updatedConversations)
    setMessageText("")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Connect with instructors and classmates
        </p>
      </div>

      {/* Messages Container */}
      <div className="grid lg:grid-cols-3 gap-6 h-[600px] lg:h-[700px]">
        {/* Conversations List */}
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
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-start gap-3 ${
                    selectedConversationId === conv.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.participantAvatar}
                      alt={conv.participantName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{conv.participantName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conv.lastMessageTime}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge variant="default" className="flex-shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation && (
          <div className="rounded-2xl border border-border flex flex-col bg-muted/30 lg:col-span-2">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedConversation.participantAvatar}
                    alt={selectedConversation.participantName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedConversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedConversation.participantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.participantRole}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem>Mute</DropdownMenuItem>
                    <DropdownMenuItem>Clear chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {msg.timestamp}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-xs ${
                          msg.isOwn
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
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
                <Button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="h-12 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
