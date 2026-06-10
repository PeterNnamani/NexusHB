"use client"

import { useState, useEffect } from "react"
import { Save, Lock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface NotificationPrefs {
  emailNotifications: boolean
  courseUpdates: boolean
  messageNotifications: boolean
}

const defaultPrefs: NotificationPrefs = {
  emailNotifications: true,
  courseUpdates: true,
  messageNotifications: true,
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data } = await supabase
        .from("users")
        .select("name, bio, notification_prefs")
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        setName(data.name || "")
        setBio(data.bio || "")
        setPrefs({ ...defaultPrefs, ...(data.notification_prefs || {}) })
      }
    }
    load()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    const { error } = await supabase
      .from("users")
      .update({ name, bio, notification_prefs: prefs })
      .eq("id", user.id)
    setIsSaving(false)
    if (error) {
      toast({ title: "Error", description: "Could not save settings", variant: "destructive" })
      return
    }
    await refreshUser()
    toast({ title: "Saved", description: "Your settings have been updated" })
  }

  const sendPasswordReset = async () => {
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    toast({
      title: error ? "Error" : "Check your email",
      description: error ? error.message : "We sent a password reset link to your email.",
      variant: error ? "destructive" : "default",
    })
  }

  const updatePref = (key: keyof NotificationPrefs, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={user?.email || ""} disabled className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">Contact support to change your email address</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2" placeholder="Tell us about yourself..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Account type</label>
                  <div className="mt-2">
                    <Badge className="bg-primary capitalize">{user?.role || "student"}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Account Security</h3>
              <Button variant="outline" className="w-full justify-start sm:w-auto" onClick={sendPasswordReset}>
                <Lock className="h-4 w-4 mr-2" />
                Send Password Reset Email
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              {[
                { key: "emailNotifications" as const, title: "Email Notifications", desc: "Receive updates via email" },
                { key: "courseUpdates" as const, title: "Course Updates", desc: "New lessons and course changes" },
                { key: "messageNotifications" as const, title: "Message Notifications", desc: "New messages from instructors" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={prefs[item.key]} onCheckedChange={(v) => updatePref(item.key, v)} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
