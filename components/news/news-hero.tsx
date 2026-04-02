export function NewsHero() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Stay Informed
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            News & Announcements
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Stay up to date with the latest platform updates, new course launches, 
            partnership announcements, and student success stories.
          </p>
        </div>
      </div>
    </section>
  )
}
