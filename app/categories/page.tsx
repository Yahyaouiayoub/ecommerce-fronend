"use client"

import { AlertCircle, LayoutGrid } from "lucide-react"
import { getCategories } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { SiteShell } from "@/components/site-shell"
import { CategoryCard } from "@/components/category-card"
import { CategoryGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { Button } from "@/components/ui/button"

export default function CategoriesPage() {
  const { data, loading, error, reload } = useApi(() => getCategories(), [])

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Categories
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore our full range of collections.
          </p>
        </header>

        {loading ? (
          <CategoryGridSkeleton count={6} />
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load categories"
            description="Connect your Laravel API at GET /categories to populate this page."
            action={
              <Button onClick={reload} variant="outline">
                Try again
              </Button>
            }
          />
        ) : !data || data.length === 0 ? (
          <StateMessage
            icon={<LayoutGrid className="size-6" />}
            title="No categories yet"
            description="Add categories in your backend to see them here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
