"use client"

import { useState, useEffect } from "react"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFilter } from "@/contexts/filter-context"

interface FilterItem {
  id: string
  label: string
  count: number
}

function FilterPill({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/60",
      )}
    >
      {label}
      <span className={cn("tabular-nums text-[10px]", selected ? "text-primary-foreground/75" : "text-muted-foreground")}>
        {count}
      </span>
    </button>
  )
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function CoursesFilter({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<FilterItem[]>([])
  const [levels, setLevels] = useState<FilterItem[]>([])
  const [prices, setPrices] = useState<FilterItem[]>([])
  const [earnings, setEarnings] = useState<FilterItem[]>([])
  const {
    selectedCategories,
    selectedLevels,
    selectedPriceRanges,
    selectedEarningsRanges,
    toggleCategory,
    toggleLevel,
    togglePriceRange,
    toggleEarningsRange,
    clearFilters,
  } = useFilter()

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch("/api/courses", { credentials: "include" })
        const data = await response.json()
        const courses = data.courses || []

        const categoryCounts: Record<string, number> = {}
        const levelCounts: Record<string, number> = {}
        const priceBuckets: Record<string, number> = {
          "0-5000": 0,
          "5001-8000": 0,
          "8001+": 0,
        }
        const earningsBuckets: Record<string, number> = {
          "0-5000": 0,
          "5001-10000": 0,
          "10001+": 0,
        }

        courses.forEach((course: { category: string; level: string; price: number; earningsPotential?: number }) => {
          categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1
          levelCounts[course.level] = (levelCounts[course.level] || 0) + 1

          if (course.price <= 5000) priceBuckets["0-5000"]++
          else if (course.price <= 8000) priceBuckets["5001-8000"]++
          else priceBuckets["8001+"]++

          const ep = Number(course.earningsPotential ?? course.price)
          if (ep <= 5000) earningsBuckets["0-5000"]++
          else if (ep <= 10000) earningsBuckets["5001-10000"]++
          else earningsBuckets["10001+"]++
        })

        setCategories(
          Object.entries(categoryCounts)
            .map(([name, count]) => ({
              id: name.toLowerCase().replace(/\s+/g, "-"),
              label: name,
              count,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        )

        setLevels(
          Object.entries(levelCounts)
            .map(([name, count]) => ({
              id: name.toLowerCase(),
              label: name,
              count,
            }))
            .sort((a, b) => {
              const order = { beginner: 0, intermediate: 1, advanced: 2 }
              return (
                (order[a.id as keyof typeof order] ?? 999) -
                (order[b.id as keyof typeof order] ?? 999)
              )
            }),
        )

        setPrices([
          { id: "0-5000", label: "₦0–5k", count: priceBuckets["0-5000"] },
          { id: "5001-8000", label: "₦5k–8k", count: priceBuckets["5001-8000"] },
          { id: "8001+", label: "₦8k+", count: priceBuckets["8001+"] },
        ])

        setEarnings([
          { id: "0-5000", label: "Up to ₦5k", count: earningsBuckets["0-5000"] },
          { id: "5001-10000", label: "₦5k–10k", count: earningsBuckets["5001-10000"] },
          { id: "10001+", label: "₦10k+", count: earningsBuckets["10001+"] },
        ])
      } catch (error) {
        console.error("Failed to load filters:", error)
      }
    }

    loadFilters()
  }, [])

  const activeCount =
    selectedCategories.length +
    selectedLevels.length +
    selectedPriceRanges.length +
    selectedEarningsRanges.length

  const hasFilters = activeCount > 0

  return (
    <div className={cn("relative h-9 w-9 shrink-0", className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filter courses"
            aria-expanded={open}
            className={cn(
              "absolute inset-0 h-9 w-9 rounded-full border-border/80 bg-background",
              "transition-colors duration-150",
              open && "border-primary/50 bg-primary/5 text-primary",
              hasFilters && !open && "border-primary/40 text-primary",
            )}
          >
            <Filter className="h-4 w-4 shrink-0" />
            {hasFilters ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "w-[min(calc(100vw-2rem),22rem)] rounded-2xl border-border/80 bg-popover p-0 shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:duration-150 data-[state=open]:duration-200",
          )}
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">Filters</span>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <div className="max-h-[min(60vh,24rem)] space-y-4 overflow-y-auto overscroll-contain p-4">
            {levels.length > 0 && (
              <FilterGroup title="Level">
                {levels.map((item) => (
                  <FilterPill
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    selected={selectedLevels.includes(item.id)}
                    onClick={() => toggleLevel(item.id)}
                  />
                ))}
              </FilterGroup>
            )}

            {categories.length > 0 && (
              <FilterGroup title="Topic">
                {categories.map((item) => (
                  <FilterPill
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    selected={selectedCategories.includes(item.id)}
                    onClick={() => toggleCategory(item.id)}
                  />
                ))}
              </FilterGroup>
            )}

            {prices.some((p) => p.count > 0) && (
              <FilterGroup title="Price">
                {prices.map((item) => (
                  <FilterPill
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    selected={selectedPriceRanges.includes(item.id)}
                    onClick={() => togglePriceRange(item.id)}
                  />
                ))}
              </FilterGroup>
            )}

            {earnings.some((e) => e.count > 0) && (
              <FilterGroup title="Earnings potential">
                {earnings.map((item) => (
                  <FilterPill
                    key={item.id}
                    label={item.label}
                    count={item.count}
                    selected={selectedEarningsRanges.includes(item.id)}
                    onClick={() => toggleEarningsRange(item.id)}
                  />
                ))}
              </FilterGroup>
            )}
          </div>

          <div className="border-t border-border/60 px-4 py-3">
            <Button
              size="sm"
              className="h-8 w-full rounded-full text-xs"
              onClick={() => setOpen(false)}
            >
              {hasFilters ? `Show results (${activeCount} filter${activeCount === 1 ? "" : "s"})` : "Done"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
