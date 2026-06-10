"use client"

import * as React from "react"
import { NexusLogo } from "@/components/brand/nexus-logo"
import { Menu, X, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useSiteView } from "@/contexts/site-view-context"
import type { SiteViewId } from "@/lib/masked-routing"
import { cn } from "@/lib/utils"

const navLinks: { id: SiteViewId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "courses", label: "Courses" },
  { id: "programs", label: "Programs" },
  { id: "news", label: "News" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
]

export function Navigation({ className }: { className?: string }) {
  const { view, navigate } = useSiteView()
  const [isOpen, setIsOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { isAuthenticated } = useAuth()
  const { items: cartItems } = useCart()

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const go = (id: SiteViewId) => {
    navigate(id)
    setIsOpen(false)
  }

  return (
    <header
      className={cn(
        "site-header fixed top-0 left-0 right-0 z-50 glass-nav backdrop-blur-xl transition-shadow duration-300",
        scrolled && "shadow-md",
        className,
      )}
    >
      <nav className="container mx-auto flex h-full items-center justify-between gap-6 px-4 lg:px-6">
        <button type="button" onClick={() => go("home")} className="shrink-0 text-left">
          <NexusLogo size="nav" className="max-w-full transition-opacity hover:opacity-90" href={null} />
        </button>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              className={cn(
                "rounded-full px-4 py-2.5 text-[15px] font-semibold transition-all duration-200",
                view === link.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button
                onClick={() => go("cart")}
                variant="outline"
                size="icon"
                className="relative h-11 w-11 rounded-full border-border/80"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartItems.length}
                  </span>
                )}
              </Button>
              <Button
                className="h-11 rounded-full bg-primary px-6 text-[15px] font-semibold shadow-sm hover:bg-primary/90"
                onClick={() => go("dashboard")}
              >
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="h-11 rounded-full px-5 text-[15px] font-semibold"
                onClick={() => go("login")}
              >
                Log In
              </Button>
              <Button
                className="h-11 rounded-full bg-primary px-6 text-[15px] font-semibold shadow-sm hover:bg-primary/90"
                onClick={() => go("signup")}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-11 w-11 rounded-full border-border/80"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-background/98 p-4 shadow-lg backdrop-blur-xl lg:hidden">
          <div className="container mx-auto flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className={cn(
                  "rounded-xl px-4 py-3 text-left text-base font-semibold transition-all",
                  view === link.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </button>
            ))}
            <hr className="my-2 border-border" />
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-start gap-2 rounded-xl text-base font-semibold"
                  onClick={() => go("cart")}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Cart {cartItems.length > 0 && `(${cartItems.length})`}
                </Button>
                <Button
                  className="h-11 w-full rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                  onClick={() => go("dashboard")}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-start rounded-xl text-base font-semibold"
                  onClick={() => go("login")}
                >
                  Log In
                </Button>
                <Button
                  className="h-11 w-full rounded-xl bg-primary text-base font-semibold hover:bg-primary/90"
                  onClick={() => go("signup")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
