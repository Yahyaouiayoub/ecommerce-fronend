"use client"

import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { getPublicSettings } from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import { useApi } from "@/lib/hooks/use-api"
import type { PublicSettings } from "@/lib/types"
import { useTranslations } from "next-intl"

const FOOTER_SECTIONS = [
  {
    titleKey: "shop",
    links: [
      { labelKey: "all_products", href: "/products" },
      { labelKey: "categories", href: "/categories" },
      { labelKey: "new_arrivals", href: "/products?sort=newest" },
      { labelKey: "best_sellers", href: "/products?sort=popular" },
    ],
  },
  {
    titleKey: "account",
    links: [
      { labelKey: "my_profile", href: "/profile", requireAuth: true },
      { labelKey: "my_orders", href: "/orders", requireAuth: true },
      { labelKey: "cart", href: "/cart" },
      { labelKey: "sign_in", href: "/login", requireGuest: true },
    ],
  },
  {
    titleKey: "support",
    links: [
      { labelKey: "contact_us", href: "/contact" },
      { labelKey: "shipping_returns", href: "/shipping-returns" },
      { labelKey: "faq", href: "/faq" },
      { labelKey: "privacy_policy", href: "/privacy" },
    ],
  },
]

export function Footer() {
  const { user } = useAuth()
  const isAuthenticated = !!user
  const isAdmin = user?.role === "admin"
  const { data: publicSettings } = useApi<PublicSettings>(() => getPublicSettings(), [])
  const logoUrl = publicSettings?.logo_url
  const t = useTranslations("footer")

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            {logoUrl ? (
              <img
                src={getImageUrl(logoUrl)}
                alt="Store logo"
                className="h-8 w-auto max-w-36 object-contain mb-3"
              />
            ) : (
              <span className="font-mono text-xl font-semibold tracking-tight">
                Lumen
              </span>
            )}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.titleKey}>
              <h3 className="text-sm font-semibold text-foreground">
                {t(section.titleKey)}
              </h3>
              <ul className="mt-4 flex flex-col gap-2">
                {section.links
                  .filter((link) => {
                    const l = link as any
                    if (l.requireAuth && !isAuthenticated) return false
                    if (l.requireGuest && isAuthenticated) return false
                    if (isAdmin && l.requireClient) return false
                    return true
                  })
                  .map((link) => (
                    <li key={link.labelKey}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("built_with")}
          </p>
        </div>
      </div>
    </footer>
  )
}
