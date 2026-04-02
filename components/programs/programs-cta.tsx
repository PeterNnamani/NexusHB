import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProgramsCTA() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="glass-card rounded-3xl p-8 lg:p-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Need Guidance?</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-balance">
            Not Sure Which Program is Right for You?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Our learning advisors can help you choose the perfect program based on your 
            goals, experience level, and career aspirations. Book a free consultation today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="rounded-full px-8 group">
                Book Free Consultation
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" size="lg" className="glass-button rounded-full px-8">
                View FAQ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
