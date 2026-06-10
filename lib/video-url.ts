/** Normalize watch/share URLs into iframe-safe embed URLs. */
export function toEmbedVideoUrl(url?: string | null): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null

  const youtubeWatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (youtubeWatch) {
    return `https://www.youtube.com/embed/${youtubeWatch[1]}`
  }

  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/)
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return null
}
