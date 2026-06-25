"use client"

import { SiteShell } from "@/components/site-shell"
import { Shield, Lock, Eye, Trash2 } from "lucide-react"

export default function PrivacyPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-muted-foreground">
          How we collect, use, and protect your personal information.
        </p>

        <div className="mt-10 space-y-8">
          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Eye className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Information We Collect</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We collect information you provide when creating an account, placing an order, or contacting us.
                This includes your name, email address, shipping address, and payment information.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">How We Use Your Information</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We use your information to process orders, send order updates, improve our services, and
                provide customer support. We do not sell your personal information to third parties.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Data Security</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We implement industry-standard security measures to protect your personal information.
                All payment transactions are encrypted using SSL technology.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Your Rights</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                You have the right to access, update, or delete your personal information at any time.
                You can manage your data through your account settings or by contacting us directly.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          This page is ready for your custom content. Add your full privacy policy and legal terms.
        </p>
      </div>
    </SiteShell>
  )
}
