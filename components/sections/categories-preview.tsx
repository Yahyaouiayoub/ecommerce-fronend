"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { getCategories } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { CategoryCard } from "@/components/category-card"
import { CategoryGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { useTranslations } from "next-intl"

export function CategoriesPreview() {
  const t = useTranslations("home")
  const { data, loading, error, reload } = useApi(() => getCategories(), [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("categories_title")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("categories_description")}
          </p>
        </div>
        <Link 
          href="/categories" 
          className="hidden sm:inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
        >
          {t("categories_all")}
        </Link>
      </div>

      <div className="mt-8">
        {loading ? (
          <CategoryGridSkeleton count={3} />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load categories"
            description="Connect your Laravel API at GET /categories to populate this section."
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
          <StateMessage title="No categories found" />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {data.slice(0, 3).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}