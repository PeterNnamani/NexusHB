import { cn } from "@/lib/utils"

interface NexusAssistantIconProps {
  className?: string
  pulse?: boolean
}

/** Hub-and-spoke mark — central node with connected satellites (the "nexus"). */
export function NexusAssistantIcon({ className, pulse = false }: NexusAssistantIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="4.5"
        className={cn("fill-current", pulse && "animate-pulse")}
      />
      <circle cx="16" cy="5" r="2.25" className="fill-current opacity-80" />
      <circle cx="25.5" cy="10.5" r="2.25" className="fill-current opacity-80" />
      <circle cx="25.5" cy="21.5" r="2.25" className="fill-current opacity-80" />
      <circle cx="16" cy="27" r="2.25" className="fill-current opacity-80" />
      <circle cx="6.5" cy="21.5" r="2.25" className="fill-current opacity-80" />
      <circle cx="6.5" cy="10.5" r="2.25" className="fill-current opacity-80" />
      <g className="stroke-current opacity-40" strokeWidth="1.5" strokeLinecap="round">
        <line x1="16" y1="11.5" x2="16" y2="7.25" />
        <line x1="19.2" y1="13.2" x2="23.3" y2="11.3" />
        <line x1="19.2" y1="18.8" x2="23.3" y2="20.7" />
        <line x1="16" y1="20.5" x2="16" y2="24.75" />
        <line x1="12.8" y1="18.8" x2="8.7" y2="20.7" />
        <line x1="12.8" y1="13.2" x2="8.7" y2="11.3" />
      </g>
    </svg>
  )
}
