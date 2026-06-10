"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { useSiteView } from "@/contexts/site-view-context"

function formatDate(date: string | null) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default function NewsArticleView() {
  const { newsSlug, navigate } = useSiteView()
  const [article, setArticle] = useState<{
    title: string
    content: string
    category: string | null
    author: string | null
    published_at: string | null
    image: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!newsSlug) {
      setLoading(false)
      return
    }
    fetch(`/api/news/${encodeURIComponent(newsSlug)}`)
      .then((r) => r.json())
      .then((data) => setArticle(data.article || null))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [newsSlug])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-[calc(var(--header-height)+1rem)] pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <button
            type="button"
            onClick={() => navigate("news")}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </button>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !article ? (
            <p className="text-muted-foreground">Article not found.</p>
          ) : (
            <>
              {article.category && <Badge className="mb-4">{article.category}</Badge>}
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{article.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
                {article.published_at && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(article.published_at)}
                  </span>
                )}
                {article.author && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {article.author}
                  </span>
                )}
              </div>
              {article.image && (
                <div className="rounded-2xl overflow-hidden mb-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.image} alt={article.title} className="w-full h-auto" />
                </div>
              )}
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
