"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { getFeaturedProducts } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"

export function FeaturedProducts() {
  const { data, loading, error, reload } = useApi(
    () => getFeaturedProducts(),
    [],
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Featured products
          </h2>
          <p className="mt-2 text-muted-foreground">
            Hand-picked favorites from our latest collection.
          </p>
        </div>
        <Link 
          href="/products" 
          className="hidden sm:inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load products"
            description="Connect your Laravel API at GET /products/featured to populate this section."
            action={
              <button 
                onClick={reload} 
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
              >
                Try again
              </button>
            }
          />
        ) : !data || data.length === 0 ? (
          <StateMessage
            title="No featured products yet"
            description="Mark products as featured in your backend to show them here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}