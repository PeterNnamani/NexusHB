"use client"

import { useEffect, useState } from "react"
import {
  Code2,
  Palette,
  BarChart3,
  Smartphone,
  Database,
  Globe,
  Layers,
  type LucideIcon,
} from "lucide-react"
import { SiteNavLink } from "@/components/site/site-nav-link"
import { CategoryBadge } from "@/components/category-badge"
import { getCategoryStyle } from "@/lib/category-colors"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  development: Code2,
  design: Palette,
  marketing: BarChart3,
  mobile: Smartphone,
  data: Database,
  web: Globe,
  default: Layers,
}

interface CategoryItem {
  id: string
  label: string
  count: number
}

function getCategoryIcon(label: string): LucideIcon {
  const key = label.toLowerCase()
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon
  }
  return CATEGORY_ICONS.default
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([])

  useEffect(() => {
    fetch("/api/courses", { cache: "no-store" })
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
            .sort((a, b) => b.count - a.count)
            .slice(0, 8),
        )
      })
      .catch(() => {})
  }, [])

  const displayCategories =
    categories.length > 0
      ? categories
      : [
          { id: "web-development", label: "Web Development", count: 0 },
          { id: "javascript", label: "JavaScript", count: 0 },
          { id: "frontend", label: "Frontend", count: 0 },
          { id: "backend", label: "Backend", count: 0 },
          { id: "full-stack", label: "Full Stack", count: 0 },
          { id: "ui-ux", label: "UI/UX", count: 0 },
          { id: "career", label: "Career Skills", count: 0 },
          { id: "freelance", label: "Freelancing", count: 0 },
        ]

  return (
    <section className="py-14 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-primary">
            Browse by topic
          </span>
          <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Top categories</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            From fundamentals to job-ready skills — pick a path and start building.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {displayCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.label)
            const style = getCategoryStyle(cat.label)
            return (
              <SiteNavLink key={cat.id} href="/courses" className="group block">
                <div
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-0.5",
                    style.cardTint,
                  )}
                >
                  <CategoryBadge category={cat.label} className="absolute left-3 top-3 normal-case" />
                  <div
                    className={cn(
                      "mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 shadow-sm",
                      style.iconColor,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                      {cat.label}
                    </p>
                    {cat.count > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cat.count} {cat.count === 1 ? "course" : "courses"}
                      </p>
                    )}
                  </div>
                </div>
              </SiteNavLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
