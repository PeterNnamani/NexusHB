"use client"

import { useEffect, useState } from "react"
import { Calendar, ArrowRight, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSiteView } from "@/contexts/site-view-context"

type NewsItem = {
  slug: string
  title: string
  excerpt: string | null
  image: string | null
  category: string | null
  published_at: string | null
}

function formatDate(date: string | null) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function NewsGridClient() {
  const { navigate } = useSiteView()
  const [articles, setArticles] = useState<NewsItem[]>([])

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => setArticles(data.news || []))
      .catch(() => setArticles([]))
  }, [])

  if (articles.length === 0) {
    return (
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">No news yet</h2>
          <p className="text-muted-foreground mt-1">Check back soon for updates.</p>
        </div>
      </section>
    )
  }

  const [featuredArticle, ...regularArticles] = articles

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {featuredArticle && (
          <button
            type="button"
            onClick={() => navigate("news-article", { newsSlug: featuredArticle.slug })}
            className="group block mb-12 w-full text-left"
          >
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {featuredArticle.image && (
                  <div className="relative aspect-video lg:aspect-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  {featuredArticle.category && (
                    <Badge className="w-fit mb-4">{featuredArticle.category}</Badge>
                  )}
                  <h2 className="text-2xl lg:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">{featuredArticle.excerpt}</p>
                  )}
                  <span className="inline-flex items-center text-sm text-primary font-medium">
                    Read article <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularArticles.map((article) => (
            <button
              key={article.slug}
              type="button"
              onClick={() => navigate("news-article", { newsSlug: article.slug })}
              className="glass-card rounded-2xl overflow-hidden text-left group"
            >
              {article.image && (
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                {article.category && <Badge variant="secondary" className="mb-2">{article.category}</Badge>}
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(article.published_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
