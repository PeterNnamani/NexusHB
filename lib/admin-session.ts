import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export const ADMIN_SESSION_COOKIE = "nexus_admin_session"
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days

export type AdminSession = {
  email: string
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_SETUP_SECRET ||
    process.env.SEED_SECRET ||
    ""
  )
}

function normalizeEnvSecret(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function getAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = normalizeEnvSecret(process.env.ADMIN_PASSWORD)
  if (!email || !password) return null
  return { email, password }
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getSessionSecret() && getAdminCredentials())
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials()
  const secret = getSessionSecret()
  if (!creds || !secret) return false
  return (
    email.trim().toLowerCase() === creds.email &&
    password.trim() === creds.password
  )
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  const bytes = new Uint8Array(sig)
  let binary = ""
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function encodePayload(data: { email: string; exp: number }): string {
  return btoa(JSON.stringify(data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function decodePayload(payload: string): { email: string; exp: number } | null {
  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(padded)
    const data = JSON.parse(json) as { email: string; exp: number }
    if (!data.email || typeof data.exp !== "number") return null
    return data
  } catch {
    return null
  }
}

export async function createAdminSessionToken(email: string): Promise<string | null> {
  const secret = getSessionSecret()
  if (!secret) return null
  const payload = encodePayload({
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  })
  const signature = await hmacSign(payload, secret)
  return `${payload}.${signature}`
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  const secret = getSessionSecret()
  if (!secret) return null

  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null

  const expected = await hmacSign(payload, secret)
  if (signature !== expected) return null

  const data = decodePayload(payload)
  if (!data || data.exp < Date.now()) return null

  return { email: data.email }
}

export function adminSessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}

export async function getAdminSessionFromRequest(
  request: NextRequest,
): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}
