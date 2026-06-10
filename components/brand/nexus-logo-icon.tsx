import { cn } from "@/lib/utils"

interface NexusLogoIconProps {
  className?: string
}

/** Online-learning mark: laptop + graduation cap on a soft emerald tile. */
export function NexusLogoIcon({ className }: NexusLogoIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-primary", className)}
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="12"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      <rect
        x="13"
        y="17"
        width="22"
        height="14"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M11 33.5h26"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 33.5v2.2c0 .8.7 1.3 1.5 1.3h13c.8 0 1.5-.5 1.5-1.3v-2.2"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 10.5 33.5 15 24 19.5 14.5 15 24 10.5Z"
        fill="currentColor"
        fillOpacity="0.92"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M31.5 15.8v4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="31.5" cy="21.2" r="1.1" fill="currentColor" />
      <path
        d="M19 23.5h4M19 26h7"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="34.5" cy="12" r="1.2" fill="currentColor" fillOpacity="0.75" />
      <path
        d="M34.5 10.2v3.6M32.7 12h3.6"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  )
}
