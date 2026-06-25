"use client"

import { SiteShell } from "@/components/site-shell"
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react"

export default function ShippingReturnsPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Shipping &amp; Returns</h1>
        <p className="mt-3 text-muted-foreground">
          Information about our shipping policies and return process.
        </p>

        <div className="mt-10 space-y-8">
          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Truck className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Shipping Policy</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We offer free shipping on orders over a certain amount. Standard shipping takes 3-5 business days.
                Expedited shipping options are available at checkout.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Return Policy</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                You can return most items within 30 days of delivery for a full refund. Items must be unused and
                in their original packaging. Custom or personalized items are non-returnable.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-medium">Refund Processing</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Refunds are processed within 5-7 business days after we receive your return. The refund will be
                issued to your original payment method.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          This page is ready for your custom content. Add your full shipping and returns policy.
        </p>
      </div>
    </SiteShell>
  )
}
