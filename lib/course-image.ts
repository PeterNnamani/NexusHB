const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d1fae5"/>
      <stop offset="100%" style="stop-color:#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <rect x="240" y="130" width="160" height="120" rx="12" fill="#ffffff88" stroke="#059669" stroke-width="2"/>
  <path d="M270 220 L320 170 L370 220 Z" fill="#059669" opacity="0.85"/>
  <text x="320" y="290" text-anchor="middle" fill="#374151" font-family="system-ui,sans-serif" font-size="20" font-weight="600">Nexus Course</text>
</svg>`

export const COURSE_PLACEHOLDER_IMAGE =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`

export function getCourseImageUrl(image?: string | null): string {
  const trimmed = image?.trim()
  if (trimmed) return trimmed
  return COURSE_PLACEHOLDER_IMAGE
}
