"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Award, Flame, Search, Copy, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Certificate {
  id: string
  certificate_no: string
  issued_at: string
  course_title: string
  course_category: string
}

export default function CertificatesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  const loadCertificates = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from("certificates")
      .select("id, certificate_no, issued_at, courses(title, category)")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })

    const certs: Certificate[] = (data || []).map((c: any) => ({
      id: c.id,
      certificate_no: c.certificate_no,
      issued_at: c.issued_at,
      course_title: c.courses?.title || "Course",
      course_category: c.courses?.category || "",
    }))
    setCertificates(certs)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  const filtered = certificates.filter((cert) =>
    cert.course_title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const copyCredential = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: "Copied", description: "Credential ID copied to clipboard" })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Certificates &amp; Achievements</h1>
        <p className="text-muted-foreground mt-1">View and share your earned certificates</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificates</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.completedCourses?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Courses Completed</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.streak ?? 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl font-semibold">Your Certificates</h2>
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading certificates...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No certificates yet</h3>
            <p className="text-muted-foreground mt-1">Complete courses to earn certificates</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((cert) => (
              <div key={cert.id} className="glass-card p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-32 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <div className="text-center">
                      <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-xs font-medium text-primary">CERTIFICATE</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{cert.course_title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Issued on {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                      {cert.course_category && <Badge variant="secondary">{cert.course_category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Credential ID: <span className="font-mono">{cert.certificate_no}</span>
                    </p>
                    <Button size="sm" variant="outline" onClick={() => copyCredential(cert.certificate_no)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Credential ID
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
