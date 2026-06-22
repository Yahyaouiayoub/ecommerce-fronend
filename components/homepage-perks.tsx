"use client"

import { Leaf, ShieldCheck, Truck } from "lucide-react"
import { getPublicSettings } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { formatPrice } from "@/lib/utils"
import type { PublicSettings } from "@/lib/types"

export function HomepagePerks() {
  const { data } = useApi<PublicSettings>(() => getPublicSettings(), [])

  const shippingMsg = data?.shipping?.enabled
    ? data.shipping.free_shipping
      ? `Free shipping on orders over ${formatPrice(data.shipping.free_shipping_min)}`
      : data.shipping.message
    : "Fast shipping on all orders"

  const PERKS = [
    {
      icon: Truck,
      title: "Free shipping",
      description: shippingMsg,
    },
    {
      icon: ShieldCheck,
      title: "Secure checkout",
      description: "Your payments are encrypted and protected.",
    },
    {
      icon: Leaf,
      title: "Sustainably made",
      description: "Responsibly sourced, built to last.",
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {PERKS.map((perk) => (
          <div
            key={perk.title}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <perk.icon className="size-5" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{perk.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {perk.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
