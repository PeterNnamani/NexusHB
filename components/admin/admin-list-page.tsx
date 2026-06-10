"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { adminFetch } from "@/lib/admin-fetch"

export type AdminColumn<T> = {
  key: keyof T | string
  label: string
  align?: "left" | "right"
  render?: (row: T) => React.ReactNode
}

interface AdminListPageProps<T extends Record<string, unknown>> {
  title: string
  description: string
  apiPath: string
  columns: AdminColumn<T>[]
  emptyMessage?: string
}

export function AdminListPage<T extends Record<string, unknown>>({
  title,
  description,
  apiPath,
  columns,
  emptyMessage = "No records found",
}: AdminListPageProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch<{ items: T[] }>(apiPath)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [apiPath])

  return (
    <div className="space-y-8 max-w-[1600px]">
      <AdminPageHeader title={title} description={description} />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${items.length} records`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-5 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`px-5 py-3 ${col.align === "right" ? "text-right tabular-nums" : ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="capitalize text-xs">
      {status}
    </Badge>
  )
}
