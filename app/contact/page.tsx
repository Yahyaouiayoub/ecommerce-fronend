import type { Metadata } from "next"
import { SiteShell } from "@/components/site-shell"
import { Mail, MapPin, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Lumen Store team. We'd love to hear from you about any questions, feedback, or support needs.",
  openGraph: {
    title: "Contact Us | Lumen Store",
    description: "Get in touch with the Lumen Store team.",
  },
}

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;d love to hear from you. Get in touch with our team.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Mail className="size-5" />
            </div>
            <h2 className="font-medium">Email</h2>
            <p className="text-sm text-muted-foreground">support@lumenstore.com</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Phone className="size-5" />
            </div>
            <h2 className="font-medium">Phone</h2>
            <p className="text-sm text-muted-foreground">+212 5XX-XXXXXX</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <MapPin className="size-5" />
            </div>
            <h2 className="font-medium">Address</h2>
            <p className="text-sm text-muted-foreground">123 Commerce Street, Casablanca, Morocco</p>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
