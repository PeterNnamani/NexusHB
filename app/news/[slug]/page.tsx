import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { getNewsBySlug } from "@/lib/content-db"

function formatDate(date: string | null) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getNewsBySlug(slug)

  if (!article) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-[calc(var(--header-height)+1rem)] pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/news"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {article.category && <Badge className="bg-primary text-primary-foreground">{article.category}</Badge>}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.published_at)}
            </span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-balance">{article.title}</h1>

          {article.author && (
            <p className="text-muted-foreground flex items-center gap-2 mb-8">
              <User className="h-4 w-4" />
              {article.author}
            </p>
          )}

          {article.image && (
            <div className="rounded-2xl overflow-hidden mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image} alt={article.title} className="w-full object-cover" />
            </div>
          )}

          {article.excerpt && <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>}

          {article.content && (
            <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
              {article.content}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
