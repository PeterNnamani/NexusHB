import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const newsArticles = [
  {
    id: 1,
    title: "Nexus Partners with Google for Cloud Computing Certification",
    excerpt: "We're excited to announce our new partnership with Google Cloud to offer industry-recognized cloud certifications to our students.",
    category: "Partnership",
    date: "Mar 12, 2026",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
    featured: true,
  },
  {
    id: 2,
    title: "New AI & Machine Learning Course Track Launching Soon",
    excerpt: "Get ready to dive into the world of AI with our comprehensive new learning path designed for all skill levels.",
    category: "Courses",
    date: "Mar 10, 2026",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Student Success: From Beginner to Senior Developer in 12 Months",
    excerpt: "Read the inspiring story of how one of our students transformed their career with Nexus courses.",
    category: "Success Story",
    date: "Mar 8, 2026",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
    featured: false,
  },
  {
    id: 4,
    title: "Platform Update: New Interactive Coding Environment",
    excerpt: "We've completely redesigned our coding environment with real-time collaboration and AI-powered assistance.",
    category: "Platform",
    date: "Mar 5, 2026",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    featured: false,
  },
  {
    id: 5,
    title: "Introducing Team Learning Plans for Businesses",
    excerpt: "Now companies can upskill their entire development team with our new enterprise learning solutions.",
    category: "Enterprise",
    date: "Mar 2, 2026",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    featured: false,
  },
  {
    id: 6,
    title: "Community Milestone: 100,000 Students and Growing",
    excerpt: "We're thrilled to announce that our community has grown to over 100,000 active learners worldwide.",
    category: "Community",
    date: "Feb 28, 2026",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop",
    featured: false,
  },
]

export function NewsGrid() {
  const featuredArticle = newsArticles.find((a) => a.featured)
  const regularArticles = newsArticles.filter((a) => !a.featured)

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Featured Article */}
        {featuredArticle && (
          <Link href={`/news/${featuredArticle.id}`} className="group block mb-12">
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="relative aspect-video lg:aspect-auto">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-primary text-primary-foreground">
                      {featuredArticle.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {featuredArticle.date}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4 group-hover:text-primary transition-colors text-balance">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 text-pretty">
                    {featuredArticle.excerpt}
                  </p>
                  <span className="inline-flex items-center text-primary font-medium group-hover:underline">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Regular Articles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularArticles.map((article) => (
            <Link key={article.id} href={`/news/${article.id}`} className="group">
              <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  <Badge variant="secondary" className="absolute top-3 left-3">
                    {article.category}
                  </Badge>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    {article.date}
                  </div>
                  <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                    {article.excerpt}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
