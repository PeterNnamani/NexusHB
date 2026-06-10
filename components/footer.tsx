import Link from "next/link"
import { Clock, Phone, Github, Twitter, Linkedin, Instagram } from "lucide-react"
import { NexusLogoIcon } from "@/components/brand/nexus-logo-icon"
import { FooterNewsletter } from "@/components/footer-newsletter"
import { Button } from "@/components/ui/button"

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/programs", label: "Programs" },
  { href: "/news", label: "News" },
  { href: "/faq", label: "FAQ" },
]

const quickLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/about", label: "About Us" },
  { href: "/suggestions", label: "Suggestions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
]

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Instagram, label: "Instagram" },
]

function FooterLinkList({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Newsletter band */}
      <div className="bg-[oklch(0.28_0.06_163)] text-white">
        <div className="container mx-auto px-4 py-10 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">Our Newsletter</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                Get course launches, earning tips, and platform updates — one email when it matters, no spam.
              </p>
            </div>
            <FooterNewsletter />
          </div>
          <p className="mt-8 text-center text-xs text-white/50">
            nexus.dev
          </p>
        </div>
      </div>

      {/* Main footer */}
      <div className="relative overflow-hidden bg-[oklch(0.18_0.02_250)] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(135deg, oklch(0.22 0.05 163 / 0.5) 0%, oklch(0.16 0.02 250 / 0.8) 50%, oklch(0.14 0.03 163 / 0.6) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="container relative z-10 mx-auto px-4 py-12 lg:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {/* Brand & social */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-4 inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
                <NexusLogoIcon className="h-10 w-10 text-primary" />
                <span className="text-xl font-extrabold tracking-tight text-white">Nexus</span>
              </Link>
              <p className="mb-5 max-w-xs text-sm leading-relaxed text-white/65">
                Empowering learners in Nigeria with project-based web courses, live classrooms, and real earning opportunities.
              </p>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:border-primary/50 hover:bg-primary/20 hover:text-white"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <FooterLinkList title="Navigation" links={navigationLinks} />
            <FooterLinkList title="Quick Links" links={quickLinks} />

            {/* Hours & CTA */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Work Hours
              </h4>
              <div className="mb-4 flex items-start gap-2.5 text-sm text-white/70">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p>Mon – Fri: 9:00 AM – 6:00 PM</p>
                  <p>Sat: 10:00 AM – 2:00 PM</p>
                  <p className="text-white/50">WAT (Lagos)</p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-white/60">
                Have questions about courses or enrollment? Our team is here to help.
              </p>
              <Button
                asChild
                className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <a href="tel:+2349038932299" className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Us
                </a>
              </Button>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/45">
              &copy; {new Date().getFullYear()} Nexus &bull; All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
