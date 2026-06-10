import Link from "next/link"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getNews } from "@/lib/content-db"
import { NewsViewAllLink } from "@/components/landing/news-view-all-link"

function formatDate(date: string | null) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export async function NewsSection() {
  const news = await getNews(3)
  if (news.length === 0) return null

  const [featured, ...rest] = news

  return (
    <section className="py-16 lg:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Latest Updates
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">News &amp; Announcements</h2>
          </div>
          <NewsViewAllLink />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Link href={`/news/${featured.slug}`} className="group lg:row-span-2">
            <div className="glass-card rounded-2xl overflow-hidden h-full">
              {featured.image && (
                <div className="relative aspect-video lg:aspect-auto lg:h-72">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  {featured.category && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      {featured.category}
                    </Badge>
                  )}
                </div>
              )}
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  {formatDate(featured.published_at)}
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-primary transition-colors text-balance">
                  {featured.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{featured.excerpt}</p>
              </div>
            </div>
          </Link>

          {rest.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`} className="group">
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row h-full">
                {article.image && (
                  <div className="relative aspect-video sm:aspect-square sm:w-48 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    {article.category && (
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(article.published_at)}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{article.excerpt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
