import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminKpiCardProps {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function AdminKpiCard({ label, value, sub, icon: Icon, className }: AdminKpiCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
          <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}
