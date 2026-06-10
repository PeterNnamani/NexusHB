import Link from "next/link"
import { cn } from "@/lib/utils"
import { NexusLogoIcon } from "@/components/brand/nexus-logo-icon"

const SIZES = {
  "sidebar-icon": { icon: "h-7 w-7", wordmark: false, text: "", gap: "" },
  xs: { icon: "h-7 w-7", wordmark: true, text: "text-sm", gap: "gap-2" },
  sidebar: { icon: "h-8 w-8", wordmark: true, text: "text-base", gap: "gap-2" },
  "sidebar-lg": { icon: "h-9 w-9", wordmark: true, text: "text-lg", gap: "gap-2.5" },
  nav: { icon: "h-11 w-11", wordmark: true, text: "text-xl", gap: "gap-3" },
  sm: { icon: "h-10 w-10", wordmark: true, text: "text-xl", gap: "gap-2.5" },
  md: { icon: "h-11 w-11", wordmark: true, text: "text-xl", gap: "gap-3" },
  lg: { icon: "h-12 w-12", wordmark: true, text: "text-2xl", gap: "gap-3" },
  xl: { icon: "h-14 w-14", wordmark: true, text: "text-2xl", gap: "gap-3" },
  "2xl": { icon: "h-14 w-14", wordmark: true, text: "text-3xl", gap: "gap-3" },
  "3xl": { icon: "h-14 w-14", wordmark: true, text: "text-2xl sm:text-3xl", gap: "gap-3" },
} as const

type NexusLogoSize = keyof typeof SIZES

interface NexusLogoProps {
  size?: NexusLogoSize
  href?: string | null
  className?: string
  priority?: boolean
}

export function NexusLogo({
  size = "md",
  href = "/",
  className,
}: NexusLogoProps) {
  const { icon, wordmark, text, gap } = SIZES[size]

  const mark = (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center text-primary",
        wordmark && gap,
        className,
      )}
      role="img"
      aria-label="Nexus"
    >
      <NexusLogoIcon className={icon} />
      {wordmark ? (
        <span
          className={cn(
            "truncate font-extrabold tracking-tight text-foreground",
            text,
          )}
        >
          Nexus
        </span>
      ) : null}
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center p-0 transition-opacity hover:opacity-85"
        aria-label="Nexus home"
      >
        {mark}
      </Link>
    )
  }

  return mark
}
