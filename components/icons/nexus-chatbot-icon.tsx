"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

interface NexusChatbotIconProps {
  className?: string
  pulse?: boolean
  /** Stronger strokes & contrast for the floating action button */
  emphasized?: boolean
}

/** Vector-only Nexus AI tutor mark — speech bubble, graduation cap, sparkle. */
export function NexusChatbotIcon({
  className,
  pulse = false,
  emphasized = false,
}: NexusChatbotIconProps) {
  const strokeScale = emphasized ? 1.2 : 1
  const maskId = useId().replace(/:/g, "")

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 text-primary",
        emphasized && "drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
        className,
      )}
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width="48" height="48" fill="white" />
          <circle cx="19.2" cy="21.8" r="2.35" fill="black" />
          <circle cx="28.8" cy="21.8" r="2.35" fill="black" />
        </mask>
      </defs>

      {/* Book-spine ear */}
      <path
        d="M8.5 21.5c0-7 2.5-12.5 5.5-12.5"
        className="stroke-current opacity-70"
        strokeWidth={2.4 * strokeScale}
        strokeLinecap="round"
      />

      {/* Speech bubble body (eyes punched out via mask) */}
      <path
        d="M13.5 16.2c0-2.65 2.15-4.8 4.8-4.8h11.4c2.65 0 4.8 2.15 4.8 4.8v9.2c0 2.65-2.15 4.8-4.8 4.8H21.2L14.8 35v-4.6c-1.15-.35-1.7-1.35-1.7-2.55v-11.65Z"
        className="fill-current"
        mask={`url(#${maskId})`}
      />

      {/* Smile */}
      <path
        d="M19.5 27.2c1.15 1.25 2.55 1.9 4.5 1.9s3.35-.65 4.5-1.9"
        className="stroke-current"
        strokeWidth={1.85 * strokeScale}
        strokeLinecap="round"
      />

      {/* Graduation cap */}
      <path d="M24 6.8 11.5 12.4 24 18 36.5 12.4 24 6.8Z" className="fill-current" />
      <path
        d="M14 12.8v5.4c0 2.35 4.2 4.25 10 4.25s10-1.9 10-4.25v-5.4"
        className="stroke-current"
        strokeWidth={1.65 * strokeScale}
        strokeLinejoin="round"
      />
      <path
        d="M37 12.4v7"
        className="stroke-current"
        strokeWidth={1.65 * strokeScale}
        strokeLinecap="round"
      />
      <circle cx="37" cy="20.5" r="1.35" className="fill-current" />

      {/* AI sparkle */}
      <path
        d="M38.8 8.2 39.55 10.15 41.5 10.9 39.55 11.65 38.8 13.6 38.05 11.65 36.1 10.9 38.05 10.15 38.8 8.2Z"
        className={cn("fill-current", pulse && "animate-pulse")}
      />
    </svg>
  )
}
