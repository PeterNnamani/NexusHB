"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface FilterContextType {
  selectedCategories: string[]
  selectedLevels: string[]
  selectedPriceRanges: string[]
  selectedEarningsRanges: string[]
  toggleCategory: (id: string) => void
  toggleLevel: (id: string) => void
  togglePriceRange: (id: string) => void
  toggleEarningsRange: (id: string) => void
  clearFilters: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
  const [selectedEarningsRanges, setSelectedEarningsRanges] = useState<string[]>([])

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleLevel = (id: string) => {
    setSelectedLevels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const togglePriceRange = (id: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(id) ? prev.filter((range) => range !== id) : [...prev, id]
    )
  }

  const toggleEarningsRange = (id: string) => {
    setSelectedEarningsRanges((prev) =>
      prev.includes(id) ? prev.filter((range) => range !== id) : [...prev, id]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedLevels([])
    setSelectedPriceRanges([])
    setSelectedEarningsRanges([])
  }

  return (
    <FilterContext.Provider
      value={{
        selectedCategories,
        selectedLevels,
        selectedPriceRanges,
        selectedEarningsRanges,
        toggleCategory,
        toggleLevel,
        togglePriceRange,
        toggleEarningsRange,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilter must be used within FilterProvider")
  }
  return context
}
