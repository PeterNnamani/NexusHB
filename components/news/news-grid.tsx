import Link from "next/link"
import { Calendar, ArrowRight, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getNews } from "@/lib/content-db"

function formatDate(date: string | null) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export async function NewsGrid() {
  const newsArticles = await getNews()

  if (newsArticles.length === 0) {
    return (
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold">No news yet</h2>
          <p className="text-muted-foreground mt-1">Check back soon for the latest updates and announcements.</p>
        </div>
      </section>
    )
  }

  const [featuredArticle, ...regularArticles] = newsArticles

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {featuredArticle && (
          <Link href={`/news/${featuredArticle.slug}`} className="group block mb-12">
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {featuredArticle.image && (
                  <div className="relative aspect-video lg:aspect-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
                  </div>
                )}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    {featuredArticle.category && (
                      <Badge className="bg-primary text-primary-foreground">{featuredArticle.category}</Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredArticle.published_at)}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors text-balance">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 text-pretty">{featuredArticle.excerpt}</p>
                  <span className="inline-flex items-center text-primary font-medium group-hover:underline">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {regularArticles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group">
                <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
                  {article.image && (
                    <div className="relative aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      {article.category && (
                        <Badge variant="secondary" className="absolute top-3 left-3">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {formatDate(article.published_at)}
                    </div>
                    <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{article.excerpt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
