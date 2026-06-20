"use client"

import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"

const FOOTER_SECTIONS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Best Sellers", href: "/products?sort=popular" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Profile", href: "/profile" },
      { label: "My Orders", href: "/orders", requireClient: true },
      { label: "Cart", href: "/cart" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "#" },
      { label: "Shipping & Returns", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
]

export function Footer() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-mono text-xl font-semibold tracking-tight">
              Lumen
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Thoughtfully curated home and lifestyle goods, delivered with care.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2">
                {section.links
                  .filter((link) => !isAdmin || !(link as any).requireClient)
                  .map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lumen. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with Next.js · Powered by a Laravel API
          </p>
        </div>
      </div>
    </footer>
  )
}
