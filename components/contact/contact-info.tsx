import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react"
import Link from "next/link"

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Our team typically responds within 24 hours",
    value: "support@nexus.dev",
    href: "mailto:support@nexus.dev",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Monday to Friday, 9am to 6pm WAT",
    value: "+234 (0) 903 893 2299",
    href: "tel:+2349038932299",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Come say hello at our office",
    value: "Lagos, Nigeria",
    href: "#",
  },
]

const hours = [
  { day: "Monday - Friday", time: "9:00 AM - 6:00 PM" },
  { day: "Saturday", time: "10:00 AM - 4:00 PM" },
  { day: "Sunday", time: "Closed" },
]

export function ContactInfo() {
  return (
    <div className="space-y-6">
      {/* Contact Methods */}
      <div className="space-y-4">
        {contactMethods.map((method) => (
          <a
            key={method.title}
            href={method.href}
            className="glass-card rounded-2xl p-6 flex items-start gap-4 group transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <method.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{method.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {method.description}
              </p>
              <p className="text-sm font-medium text-primary">{method.value}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Business Hours */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold">Business Hours</h3>
        </div>
        <div className="space-y-3">
          {hours.map((item) => (
            <div key={item.day} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.day}</span>
              <span className="font-medium">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Chat */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Live Chat</h3>
            <p className="text-sm text-muted-foreground">
              Available during business hours
            </p>
          </div>
        </div>
        <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
          Start Live Chat
        </button>
      </div>

      {/* FAQ Link */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Looking for quick answers?
        </p>
        <Link
          href="/faq"
          className="text-primary font-medium hover:underline"
        >
          Check our FAQ section
        </Link>
      </div>
    </div>
  )
}
