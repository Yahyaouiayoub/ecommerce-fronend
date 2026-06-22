import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { BestSellers } from "@/components/sections/best-sellers"
import { FeaturedProducts } from "@/components/sections/featured-products"
import { CategoriesPreview } from "@/components/sections/categories-preview"
import { HomepageCta } from "@/components/homepage-cta"
import { HomepagePerks } from "@/components/homepage-perks"
import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
}

export default function HomePage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <Image
            src="/hero.png"
            alt="A bright, modern living space styled with home decor"
            width={1600}
            height={900}
            priority
            className="h-[60vh] min-h-[420px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 sm:px-10 lg:px-14">
              <span className="inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
                New season collection
              </span>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-balance text-background sm:text-5xl">
                Beautifully crafted goods for modern living
              </h1>
              <p className="mt-4 max-w-md text-pretty text-background/85">
                Discover curated home and lifestyle pieces designed to bring
                warmth and intention to every space.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link 
                  href="/products" 
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  Shop now
                  <ArrowRight className="size-4" />
                </Link>
                <Link 
                  href="/categories" 
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Browse categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <HomepagePerks />

      <BestSellers />

      <CategoriesPreview />
      <FeaturedProducts />

      <HomepageCta />
    </SiteShell>
  )
}