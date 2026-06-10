"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useToast } from "@/hooks/use-toast"
import { adminFetch, invalidateAdminFetch } from "@/lib/admin-fetch"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const ROLES = ["student", "tutor", "admin"] as const

export function AdminUsers() {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await adminFetch<{ users: AdminUser[] }>("/api/admin/users")
      setUsers(data.users || [])
    } catch {
      toast({ title: "Could not load users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const updateRole = async (userId: string, role: string) => {
    setUpdating(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u)),
      )
      toast({ title: "Role updated" })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Update failed",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <AdminPageHeader
        title="Users"
        description="View accounts and assign roles. Only admins can manage users."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_140px_120px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No users found.</p>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="grid sm:grid-cols-[1fr_1fr_140px_120px] gap-4 items-center px-5 py-4 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{u.name || "—"}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                <Select
                  value={u.role}
                  onValueChange={(role) => updateRole(u.id, role)}
                  disabled={updating === u.id}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Platform operators sign in separately at <code className="text-xs bg-muted px-1 rounded">/admin/login</code>.
      </p>
    </div>
  )
}
