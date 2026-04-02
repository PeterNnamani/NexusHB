import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const news = [
  {
    id: 1,
    title: "Nexus Partners with Google for Cloud Computing Certification",
    excerpt: "We're excited to announce our new partnership with Google Cloud to offer industry-recognized cloud certifications.",
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
]

export function NewsSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Latest Updates
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">
              News & Announcements
            </h2>
          </div>
          <Link href="/news">
            <Button variant="outline" className="glass-button rounded-full group">
              View All News
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured Article */}
          <Link href={`/news/${news[0].id}`} className="group lg:row-span-2">
            <div className="glass-card rounded-2xl overflow-hidden h-full">
              <div className="relative aspect-video lg:aspect-auto lg:h-72">
                <img
                  src={news[0].image}
                  alt={news[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {news[0].category}
                </Badge>
              </div>
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  {news[0].date}
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-primary transition-colors text-balance">
                  {news[0].title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {news[0].excerpt}
                </p>
              </div>
            </div>
          </Link>

          {/* Other Articles */}
          {news.slice(1).map((article) => (
            <Link key={article.id} href={`/news/${article.id}`} className="group">
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row h-full">
                <div className="relative aspect-video sm:aspect-square sm:w-48 flex-shrink-0">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
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
