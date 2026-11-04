import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPageSkeleton({ courseDetail = false }: { courseDetail?: boolean }) {
  if (courseDetail) {
    return (
      <div className="space-y-5" aria-label="Loading course details" role="status">
        <Skeleton className="h-48 w-full rounded-b-xl sm:h-56 lg:h-64" />
        <div className="space-y-3 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid gap-5 pt-2 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
        <span className="sr-only">Loading course details</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" aria-label="Loading page" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
      <span className="sr-only">Loading page</span>
    </div>
  )
}
