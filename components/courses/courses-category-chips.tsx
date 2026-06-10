"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilter } from "@/contexts/filter-context"

interface CategoryItem {
  id: string
  label: string
  count: number
}

export function CoursesCategoryChips() {
  const { selectedCategories, selectCategoryOnly } = useFilter()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const activeCategory = selectedCategories.length === 1 ? selectedCategories[0] : null
  const isTrending = selectedCategories.length === 0

  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const counts: Record<string, number> = {}
        for (const course of data.courses || []) {
          counts[course.category] = (counts[course.category] || 0) + 1
        }
        setCategories(
          Object.entries(counts)
            .map(([label, count]) => ({
              id: label.toLowerCase().replace(/\s+/g, "-"),
              label,
              count,
            }))
            .sort((a, b) => b.count - a.count),
        )
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => selectCategoryOnly(null)}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
          isTrending
            ? "border-primary bg-primary/10 text-primary shadow-sm"
            : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/60",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", isTrending && "fill-primary")} />
        Trending
      </button>

      {categories.map((cat) => {
        const selected = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => selectCategoryOnly(selected ? null : cat.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/60",
            )}
          >
            {cat.label}
            <span
              className={cn(
                "text-xs tabular-nums",
                selected ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              {cat.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
