"use client"

import { useState } from "react"
import { Save, Lock, Bell, Eye, Palette, HelpCircle, LogOut, Trash2, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface UserSettings {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    courseUpdates: boolean
    assignmentReminders: boolean
    messageNotifications: boolean
  }
  privacy: {
    profileVisibility: "public" | "private" | "friends-only"
    showActivityStatus: boolean
    allowMessages: boolean
  }
  preferences: {
    theme: "light" | "dark" | "system"
    language: "en" | "es" | "fr" | "de"
    timezone: string
  }
}

const defaultSettings: UserSettings = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 000-0000",
  bio: "Passionate about learning and personal growth.",
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    assignmentReminders: true,
    messageNotifications: true,
  },
  privacy: {
    profileVisibility: "public",
    showActivityStatus: true,
    allowMessages: true,
  },
  preferences: {
    theme: "system",
    language: "en",
    timezone: "UTC-5",
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaveSuccess(true)
    setIsSaving(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const updateNotification = (key: keyof UserSettings["notifications"], value: boolean) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
  }

  const updatePrivacy = (key: keyof UserSettings["privacy"], value: any) => {
    setSettings({
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    })
  }

  const updatePreference = (key: keyof UserSettings["preferences"], value: string) => {
    setSettings({
      ...settings,
      preferences: { ...settings.preferences, [key]: value },
    })
  }

  return (
    <div className="space-y-8 pt-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={settings.firstName}
                    onChange={(e) =>
                      setSettings({ ...settings, firstName: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={settings.lastName}
                    onChange={(e) =>
                      setSettings({ ...settings, lastName: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={settings.email} disabled className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact support to change your email address
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Membership</label>
                  <div className="mt-2">
                    <Badge className="bg-primary">Premium Member</Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Account Security</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Two-Factor Authentication
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These actions cannot be undone. Please proceed with caution.
              </p>
              <div className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All your data will be
                        permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm">
                        Type your email to confirm:{" "}
                        <strong>{settings.email}</strong>
                      </p>
                      <Input placeholder="Confirm email..." />
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          Cancel
                        </Button>
                        <Button variant="destructive" className="flex-1">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(value) =>
                      updateNotification("emailNotifications", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(value) =>
                      updateNotification("pushNotifications", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Course Updates</p>
                    <p className="text-sm text-muted-foreground">
                      New lessons and course changes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.courseUpdates}
                    onCheckedChange={(value) =>
                      updateNotification("courseUpdates", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Assignment Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming deadlines
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.assignmentReminders}
                    onCheckedChange={(value) =>
                      updateNotification("assignmentReminders", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Message Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      New messages from instructors
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.messageNotifications}
                    onCheckedChange={(value) =>
                      updateNotification("messageNotifications", value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy Controls</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-3">Profile Visibility</p>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value: any) =>
                      updatePrivacy("profileVisibility", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends-only">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Activity Status</p>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you're online
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.showActivityStatus}
                    onCheckedChange={(value) =>
                      updatePrivacy("showActivityStatus", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Allow Messages</p>
                    <p className="text-sm text-muted-foreground">
                      Accept messages from other users
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.allowMessages}
                    onCheckedChange={(value) =>
                      updatePrivacy("allowMessages", value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">General Preferences</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </p>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value: any) =>
                      updatePreference("theme", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <span className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </span>
                      </SelectItem>
                      <SelectItem value="dark">
                        <span className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </span>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-3">Language</p>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value: any) =>
                      updatePreference("language", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-3">Timezone</p>
                  <Select
                    value={settings.preferences.timezone}
                    onValueChange={(value) =>
                      updatePreference("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                      <SelectItem value="UTC-6">CST (UTC-6)</SelectItem>
                      <SelectItem value="UTC-7">MST (UTC-7)</SelectItem>
                      <SelectItem value="UTC-8">PST (UTC-8)</SelectItem>
                      <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                      <SelectItem value="UTC+1">CET (UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        {saveSuccess && (
          <p className="text-sm text-green-600">✓ Settings saved successfully</p>
        )}
      </div>
    </div>
  )
}
