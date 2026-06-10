import { cn } from "@/lib/utils"
import { getCategoryBadgeClass } from "@/lib/category-colors"

export function CategoryBadge({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        getCategoryBadgeClass(category),
        className,
      )}
    >
      {category}
    </span>
  )
}
