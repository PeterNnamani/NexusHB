export type WebSearchHit = {
  title: string
  url: string
  snippet: string
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

/** DuckDuckGo instant answers (fast, no API key). */
async function ddgInstantAnswers(query: string): Promise<WebSearchHit[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { Accept: "application/json" },
  })
  if (!res.ok) return []

  const data = (await res.json()) as {
    Abstract?: string
    AbstractURL?: string
    Heading?: string
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }>
  }

  const hits: WebSearchHit[] = []

  if (data.Abstract && data.AbstractURL) {
    hits.push({
      title: data.Heading || query,
      url: data.AbstractURL,
      snippet: data.Abstract,
    })
  }

  for (const topic of data.RelatedTopics || []) {
    if (topic.Text && topic.FirstURL) {
      hits.push({
        title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 80),
        url: topic.FirstURL,
        snippet: topic.Text,
      })
    }
  }

  return hits.slice(0, 5)
}

/** DuckDuckGo HTML results (broader coverage, no API key). */
async function ddgHtmlResults(query: string): Promise<WebSearchHit[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  })
  if (!res.ok) return []

  const html = await res.text()
  const hits: WebSearchHit[] = []
  const linkRe =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null && hits.length < 6) {
    const rawUrl = decodeHtml(match[1].replace(/&amp;/g, "&"))
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, ""))
    const snippet = decodeHtml(match[3].replace(/<[^>]+>/g, ""))
    if (!title || !snippet) continue
    hits.push({ title, url: rawUrl, snippet })
  }

  return hits
}

function dedupeHits(hits: WebSearchHit[]): WebSearchHit[] {
  const seen = new Set<string>()
  return hits.filter((h) => {
    const key = h.url || h.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatWebSearchForPrompt(hits: WebSearchHit[]): string {
  if (hits.length === 0) {
    return "No live web results were retrieved for this query. Answer from your training knowledge and note if information may be outdated."
  }

  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title}\nURL: ${h.url}\n${h.snippet}`,
    )
    .join("\n\n")
}

/**
 * Fetches recent web snippets to ground answers in online data.
 * Uses DuckDuckGo (no extra API key required).
 */
export async function searchWeb(query: string): Promise<WebSearchHit[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    const [instant, html] = await Promise.all([
      ddgInstantAnswers(trimmed).catch(() => []),
      ddgHtmlResults(trimmed).catch(() => []),
    ])
    return dedupeHits([...instant, ...html]).slice(0, 6)
  } catch (error) {
    console.warn("[web-search] failed:", error)
    return []
  }
}
