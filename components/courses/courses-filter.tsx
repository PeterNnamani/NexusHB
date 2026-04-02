"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useFilter } from "@/contexts/filter-context"

interface FilterItem {
  id: string
  label: string
  count: number
}

interface FilterSectionProps {
  title: string
  items: FilterItem[]
  selected: string[]
  onToggle: (id: string) => void
}

function FilterSection({ title, items, selected, onToggle }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border-b border-border pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-1 font-semibold text-left"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-2 mt-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox
                id={item.id}
                checked={selected.includes(item.id)}
                onCheckedChange={() => onToggle(item.id)}
              />
              <Label
                htmlFor={item.id}
                className="flex-1 text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-muted-foreground">({item.count})</span>
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CoursesFilter() {
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
        const response = await fetch('/courses.json')
        const data = await response.json()
        const courses = data.courses || []

        const categoryCounts: { [key: string]: number } = {}
        const levelCounts: { [key: string]: number } = {}
        const priceBuckets: { [key: string]: number } = {
          '0-5000': 0,
          '5001-8000': 0,
          '8001+': 0,
        }
        const earningsBuckets: { [key: string]: number } = {
          '0-5000': 0,
          '5001-10000': 0,
          '10001+': 0,
        }

        courses.forEach((course: any) => {
          categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1
          levelCounts[course.level] = (levelCounts[course.level] || 0) + 1

          if (course.price <= 5000) {
            priceBuckets['0-5000']++
          } else if (course.price <= 8000) {
            priceBuckets['5001-8000']++
          } else {
            priceBuckets['8001+']++
          }

          const earnings = Number(course.earningsPotential ?? course.price)
          if (earnings <= 5000) {
            earningsBuckets['0-5000']++
          } else if (earnings <= 10000) {
            earningsBuckets['5001-10000']++
          } else {
            earningsBuckets['10001+']++
          }
        })

        const categoryItems: FilterItem[] = Object.entries(categoryCounts)
          .map(([name, count]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            label: name,
            count: count as number,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        const levelItems: FilterItem[] = Object.entries(levelCounts)
          .map(([name, count]) => ({
            id: name.toLowerCase(),
            label: name,
            count: count as number,
          }))
          .sort((a, b) => {
            const order = { beginner: 0, intermediate: 1, advanced: 2 }
            return (order[a.id as keyof typeof order] ?? 999) - (order[b.id as keyof typeof order] ?? 999)
          })

        setCategories(categoryItems)
        setLevels(levelItems)
        setPrices([
          { id: '0-5000', label: '₦0 - ₦5,000', count: priceBuckets['0-5000'] },
          { id: '5001-8000', label: '₦5,001 - ₦8,000', count: priceBuckets['5001-8000'] },
          { id: '8001+', label: '₦8,001+', count: priceBuckets['8001+'] },
        ])
        setEarnings([
          { id: '0-5000', label: 'Up to ₦5,000', count: earningsBuckets['0-5000'] },
          { id: '5001-10000', label: '₦5,001 - ₦10,000', count: earningsBuckets['5001-10000'] },
          { id: '10001+', label: '₦10,001+', count: earningsBuckets['10001+'] },
        ])
      } catch (error) {
        console.error('Failed to load filters:', error)
      }
    }

    loadFilters()
  }, [])

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedLevels.length > 0 ||
    selectedPriceRanges.length > 0 ||
    selectedEarningsRanges.length > 0

  return (
    <div className="glass-card rounded-2xl p-4 sticky top-24">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-primary hover:text-primary/80"
          >
            Clear All
          </Button>
        )}
      </div>

      <FilterSection
        title="Category"
        items={categories}
        selected={selectedCategories}
        onToggle={toggleCategory}
      />

      <FilterSection
        title="Level"
        items={levels}
        selected={selectedLevels}
        onToggle={toggleLevel}
      />

      <FilterSection
        title="Price"
        items={prices}
        selected={selectedPriceRanges}
        onToggle={togglePriceRange}
      />

      <FilterSection
        title="Earnings Potential"
        items={earnings}
        selected={selectedEarningsRanges}
        onToggle={toggleEarningsRange}
      />
    </div>
  )
}
