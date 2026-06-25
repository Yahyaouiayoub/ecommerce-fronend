"use client"

import Link from "next/link"
import { AlertCircle, TrendingUp } from "lucide-react"
import { getBestSellers } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { useTranslations } from "next-intl"

export function BestSellers() {
  const t = useTranslations("home")
  const { data, loading, error, reload } = useApi(
    () => getBestSellers(),
    [],
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {t("best_sellers_title")}
            </h2>
          </div>
          <p className="mt-2 text-muted-foreground">
            {t("best_sellers_description")}
          </p>
        </div>
        <Link
          href="/products?best_sellers=true"
          className="hidden sm:inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
        >
          {t("best_sellers_view_all")}
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load best sellers"
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
            title="No best sellers yet"
            description="Products with orders will appear here once customers start shopping."
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
