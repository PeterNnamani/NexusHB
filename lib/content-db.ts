import {
  createRestClient,
  isSupabaseConfigured,
  logSupabaseConnectionError,
} from "@/lib/supabase-rest"

function client() {
  return createRestClient()
}

export interface NewsArticle {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  image: string | null
  author: string | null
  category: string | null
  published_at: string | null
}

export interface Testimonial {
  id: string
  name: string
  role: string | null
  company: string | null
  avatar: string | null
  quote: string
  rating: number
}

export interface Program {
  id: string
  slug: string
  title: string
  description: string | null
  duration: string | null
  level: string | null
  price: number
  image: string | null
  students_count: number
  featured: boolean
}

export async function getNews(limit?: number): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured()) return []
  let query = client()
    .from("news")
    .select("id, slug, title, excerpt, content, image, author, category, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) {
    logSupabaseConnectionError("getNews", error)
    return []
  }
  return (data as NewsArticle[]) || []
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await client()
    .from("news")
    .select("id, slug, title, excerpt, content, image, author, category, published_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle()
  if (error) {
    logSupabaseConnectionError("getNewsBySlug", error)
    return null
  }
  return (data as NewsArticle) || null
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await client()
    .from("testimonials")
    .select("id, name, role, company, avatar, quote, rating")
    .eq("featured", true)
    .order("created_at", { ascending: false })
  if (error) {
    logSupabaseConnectionError("getTestimonials", error)
    return []
  }
  return (data as Testimonial[]) || []
}

export async function getPrograms(): Promise<Program[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await client()
    .from("programs")
    .select("id, slug, title, description, duration, level, price, image, students_count, featured")
    .eq("featured", true)
    .order("created_at", { ascending: false })
  if (error) {
    logSupabaseConnectionError("getPrograms", error)
    return []
  }
  return (data as Program[]) || []
}
