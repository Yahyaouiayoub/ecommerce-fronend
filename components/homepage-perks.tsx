"use client"

import { Leaf, ShieldCheck, Truck } from "lucide-react"
import { getPublicSettings } from "@/lib/api/services"
import { useSharedData } from "@/lib/hooks/use-api"
import { formatPrice } from "@/lib/utils"
import type { PublicSettings } from "@/lib/types"
import { useTranslations } from "next-intl"

export function HomepagePerks() {
  const t = useTranslations("home")
  const { data } = useSharedData<PublicSettings>("publicSettings", getPublicSettings)

  const shippingMsg = data?.shipping?.enabled
    ? data.shipping.free_shipping
      ? t("perks_free_shipping_on", { amount: formatPrice(data.shipping.free_shipping_min) })
      : data.shipping.message
    : t("perks_free_shipping_desc")

  const PERKS = [
    {
      icon: Truck,
      title: t("perks_free_shipping"),
      description: shippingMsg,
    },
    {
      icon: ShieldCheck,
      title: t("perks_secure_checkout"),
      description: t("perks_secure_checkout_desc"),
    },
    {
      icon: Leaf,
      title: t("perks_sustainably_made"),
      description: t("perks_sustainably_made_desc"),
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
