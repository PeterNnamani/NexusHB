export function ContactHero() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Have a question or need help? Our team is here to assist you. 
            Fill out the form below and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </div>
    </section>
  )
}
