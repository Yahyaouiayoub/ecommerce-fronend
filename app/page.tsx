import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { FeaturedProducts } from "@/components/sections/featured-products"
import { CategoriesPreview } from "@/components/sections/categories-preview"

const PERKS = [
  {
    icon: Truck,
    title: "Free shipping",
    description: "On all orders over $75, delivered fast.",
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

      <CategoriesPreview />
      <FeaturedProducts />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance">
            Join the Lumen community
          </h2>
          <p className="max-w-md text-pretty text-primary-foreground/80">
            Create an account to track orders, save favorites, and check out
            faster.
          </p>
          <Link 
            href="/register" 
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors mt-2"
          >
            Create an account
          </Link>
        </div>
      </section>
    </SiteShell>
  )
}