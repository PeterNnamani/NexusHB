"use client";

import { useState } from "react";
import { Funnel } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { CoursesGrid } from "@/components/courses/courses-grid-new";
import { CoursesFilter } from "@/components/courses/courses-filter";
import { FilterProvider } from "@/contexts/filter-context";

export default function BrowseCoursesPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FilterProvider>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Browse Courses</h1>
            <p className="text-muted-foreground mt-2">
              Explore available courses sourced directly from the shared
              catalog.
            </p>
          </div>

          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                <Funnel className="h-4 w-4" />
                Filters
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[24rem] max-w-[90vw] p-0">
              <div className="p-4">
                <CoursesFilter sticky={false} />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <CoursesGrid />
        </div>
      </div>
    </FilterProvider>
  );
}
