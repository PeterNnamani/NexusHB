/** Rule-based formatter when OpenAI is unavailable. */
export function formatMaterialFallback(rawText: string, title?: string): string {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return ""

  const docTitle = title?.trim() || lines[0]
  const bodyLines = title?.trim() ? lines : lines.slice(1)

  const sections: string[] = [`# ${docTitle}`, ""]

  let currentSection: string[] = []

  const flushSection = (heading: string) => {
    if (currentSection.length === 0) return
    sections.push(`## ${heading}`, "")
    for (const line of currentSection) {
      if (line.startsWith("- ") || line.startsWith("• ")) {
        sections.push(line.replace(/^• /, "- "))
      } else if (/^\d+[\).]\s/.test(line)) {
        sections.push(line.replace(/^(\d+)[).]\s/, "$1. "))
      } else {
        sections.push(line)
      }
    }
    sections.push("")
    currentSection = []
  }

  for (const line of bodyLines.length ? bodyLines : lines) {
    const isHeading =
      line.length < 80 &&
      (line.endsWith(":") ||
        /^[A-Z][^.!?]*$/.test(line) ||
        /^(overview|introduction|summary|key points|steps|objectives|resources)/i.test(line))

    if (isHeading && currentSection.length > 0) {
      flushSection(currentSection[0] || "Section")
      currentSection = [line.replace(/:$/, "")]
    } else if (isHeading && currentSection.length === 0) {
      currentSection = [line.replace(/:$/, "")]
    } else {
      currentSection.push(line)
    }
  }

  if (currentSection.length > 0) {
    const heading =
      currentSection.length === 1 && currentSection[0].length < 60
        ? currentSection[0]
        : "Content"
    if (currentSection.length === 1 && heading === currentSection[0]) {
      sections.push("## Overview", "", currentSection[0], "")
    } else {
      flushSection(heading === currentSection[0] ? "Overview" : heading)
    }
  }

  sections.push("---", "", "*Formatted with Nexus course assistant.*")
  return sections.join("\n").trim()
}

export function isDocumentMaterialUrl(url: string): boolean {
  return url.startsWith("data:text/markdown") || url.startsWith("data:text/plain")
}

export function decodeDocumentMaterialUrl(url: string): string {
  if (!isDocumentMaterialUrl(url)) return url
  const comma = url.indexOf(",")
  if (comma === -1) return url
  const payload = url.slice(comma + 1)
  try {
    return decodeURIComponent(payload)
  } catch {
    return payload
  }
}

export function encodeDocumentMaterial(content: string): string {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(content)}`
}
