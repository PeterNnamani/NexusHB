import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getAdminDb } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PublicProfile = {
  id: string
  name: string
  avatar: string | null
}

function publicProfile(profile: { id: string; name: string | null; avatar: string | null }): PublicProfile {
  return {
    id: profile.id,
    name: profile.name?.trim() || "User",
    avatar: profile.avatar || null,
  }
}

async function getAuthenticatedUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const otherUserId = request.nextUrl.searchParams.get("with")
  const email = request.nextUrl.searchParams.get("email")
  const admin = getAdminDb()

  if (email !== null && otherUserId === null) {
    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 320) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    const emailPattern = normalizedEmail.replace(/[\\%_]/g, "\\$&")
    const { data: profile, error } = await admin
      .from("users")
      .select("id, name, avatar")
      .ilike("email", emailPattern)
      .maybeSingle()

    if (error) {
      console.error("Message recipient lookup failed:", error)
      return NextResponse.json({ error: "Could not find that account" }, { status: 500 })
    }
    if (!profile || profile.id === user.id) {
      return NextResponse.json({ error: "No other account found for that email" }, { status: 404 })
    }

    return NextResponse.json({ other: publicProfile(profile) })
  }

  if (otherUserId !== null) {
    if (!UUID_PATTERN.test(otherUserId) || otherUserId === user.id) {
      return NextResponse.json({ error: "Invalid conversation user" }, { status: 400 })
    }

    const { data: otherProfileData, error: profileError } = await admin
      .from("users")
      .select("id, name, avatar")
      .eq("id", otherUserId)
      .maybeSingle()

    if (profileError) {
      console.error("Message conversation profile lookup failed:", profileError)
      return NextResponse.json({ error: "Could not load the conversation" }, { status: 500 })
    }
    if (!otherProfileData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [sentResult, receivedResult] = await Promise.all([
      admin
        .from("messages")
        .select("id, sender_id, receiver_id, text, created_at, read")
        .eq("sender_id", user.id)
        .eq("receiver_id", otherUserId)
        .order("created_at", { ascending: true })
        .limit(1000),
      admin
        .from("messages")
        .select("id, sender_id, receiver_id, text, created_at, read")
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1000),
    ])

    if (sentResult.error || receivedResult.error) {
      console.error("Message conversation load failed:", sentResult.error || receivedResult.error)
      return NextResponse.json({ error: "Could not load messages" }, { status: 500 })
    }

    const messageRows = [...(sentResult.data || []), ...(receivedResult.data || [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    const unreadIds = messageRows
      .filter((message) => message.receiver_id === user.id && !message.read)
      .map((message) => message.id)

    if (unreadIds.length > 0) {
      const { error: updateError } = await admin
        .from("messages")
        .update({ read: true })
        .in("id", unreadIds)

      if (updateError) {
        console.error("Message read status update failed:", updateError)
        return NextResponse.json({ error: "Could not update message status" }, { status: 500 })
      }
    }

    const senderProfileData = await admin
      .from("users")
      .select("id, name, avatar")
      .eq("id", user.id)
      .maybeSingle()

    if (senderProfileData.error) {
      console.error("Message sender profile lookup failed:", senderProfileData.error)
      return NextResponse.json({ error: "Could not load message profiles" }, { status: 500 })
    }

    const profiles = new Map<string, PublicProfile>()
    if (senderProfileData.data) {
      profiles.set(senderProfileData.data.id, publicProfile(senderProfileData.data))
    }
    profiles.set(otherProfileData.id, publicProfile(otherProfileData))

    return NextResponse.json({
      other: publicProfile(otherProfileData),
      messages: messageRows.map((message) => ({
        ...message,
        sender: profiles.get(message.sender_id),
        receiver: profiles.get(message.receiver_id),
      })),
    })
  }

  const { data: recentMessages, error } = await admin
    .from("messages")
    .select("sender_id, receiver_id, text, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("Message conversation list load failed:", error)
    return NextResponse.json({ error: "Could not load conversations" }, { status: 500 })
  }

  const latestByUser = new Map<string, (typeof recentMessages)[number]>()
  for (const message of recentMessages || []) {
    const counterpartId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    if (!latestByUser.has(counterpartId)) latestByUser.set(counterpartId, message)
  }

  const counterpartIds = [...latestByUser.keys()]
  if (counterpartIds.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const { data: profiles, error: profilesError } = await admin
    .from("users")
    .select("id, name, avatar")
    .in("id", counterpartIds)

  if (profilesError) {
    console.error("Message conversation profiles load failed:", profilesError)
    return NextResponse.json({ error: "Could not load conversation profiles" }, { status: 500 })
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, publicProfile(profile)]))
  const conversations = counterpartIds
    .map((id) => {
      const latest = latestByUser.get(id)
      const other = profilesById.get(id)
      if (!latest || !other) return null
      return {
        other,
        lastMessage: latest.text,
        lastMessageAt: latest.created_at,
      }
    })
    .filter((conversation) => conversation !== null)

  return NextResponse.json({ conversations })
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const body = payload as Record<string, unknown>
  const receiverId = body.receiverId
  const rawText = body.text
  const messageId = body.id

  if (typeof receiverId !== "string" || !UUID_PATTERN.test(receiverId) || receiverId === user.id) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 })
  }
  if (
    typeof rawText !== "string" ||
    rawText.includes("\0") ||
    rawText.trim().length === 0 ||
    rawText.trim().length > 5000
  ) {
    return NextResponse.json({ error: "Message must be between 1 and 5000 characters" }, { status: 400 })
  }
  if (messageId !== undefined && (typeof messageId !== "string" || !UUID_PATTERN.test(messageId))) {
    return NextResponse.json({ error: "Invalid message id" }, { status: 400 })
  }

  const text = rawText.trim()
  const admin = getAdminDb()
  const { data: recipient, error: recipientError } = await admin
    .from("users")
    .select("id")
    .eq("id", receiverId)
    .maybeSingle()

  if (recipientError) {
    console.error("Message recipient validation failed:", recipientError)
    return NextResponse.json({ error: "Could not validate recipient" }, { status: 500 })
  }
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
  }

  const newMessage = {
    ...(typeof messageId === "string" ? { id: messageId } : {}),
    sender_id: user.id,
    receiver_id: receiverId,
    text,
  }

  const { data: inserted, error: insertError } = await admin
    .from("messages")
    .insert(newMessage)
    .select("id, sender_id, receiver_id, text, created_at, read")
    .single()

  let message = inserted
  let status = 201

  if (insertError && typeof messageId === "string") {
    const { data: existing, error: existingError } = await admin
      .from("messages")
      .select("id, sender_id, receiver_id, text, created_at, read")
      .eq("id", messageId)
      .maybeSingle()

    if (existingError) {
      console.error("Message retry lookup failed:", existingError)
      return NextResponse.json({ error: "Could not verify message status" }, { status: 500 })
    }
    if (existing) {
      if (
        existing.sender_id !== user.id ||
        existing.receiver_id !== receiverId ||
        existing.text !== text
      ) {
        return NextResponse.json({ error: "Message id is already in use" }, { status: 409 })
      }
      message = existing
      status = 200
    }
  }

  if (insertError && !message) {
    console.error("Message send failed:", insertError)
    return NextResponse.json({ error: "Could not send message" }, { status: 500 })
  }
  if (!message) {
    return NextResponse.json({ error: "Could not send message" }, { status: 500 })
  }

  const { data: profiles, error: profilesError } = await admin
    .from("users")
    .select("id, name, avatar")
    .in("id", [message.sender_id, message.receiver_id])

  if (profilesError) {
    console.error("Message profiles lookup failed:", profilesError)
    return NextResponse.json({ error: "Message sent, but its profile data could not be loaded" }, { status: 500 })
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, publicProfile(profile)]))
  return NextResponse.json(
    {
      message: {
        ...message,
        sender: profilesById.get(message.sender_id),
        receiver: profilesById.get(message.receiver_id),
      },
    },
    { status },
  )
}
