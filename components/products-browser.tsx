"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { AlertCircle, PackageSearch } from "lucide-react"
import { getProducts, type ProductQuery } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SORT_OPTIONS: { value: NonNullable<ProductQuery["sort"]>; label: string }[] =
  [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most popular" },
  ]

export function ProductsBrowser() {
  const router = useRouter()
  const params = useSearchParams()

  const search = params.get("search") ?? ""
  const category = params.get("category") ?? ""
  const sort = (params.get("sort") as ProductQuery["sort"]) ?? "newest"
  const page = Number(params.get("page") ?? "1")

  const query: ProductQuery = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      sort,
      page,
      per_page: 12,
    }),
    [search, category, sort, page],
  )

  const { data, loading, error, reload } = useApi(
    () => getProducts(query),
    [search, category, sort, page],
  )

  function updateParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key)
      else next.set(key, value)
    }
    // reset page when filters change
    if (!("page" in updates)) next.delete("page")
    router.push(`/products?${next.toString()}`)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = new FormData(e.currentTarget).get("search") as string
    updateParam({ search: value })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {category ? `Shop: ${category}` : "All products"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {data ? `${data.total} products available` : "Browse our collection."}
        </p>
      </header>

      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="w-full max-w-sm">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search products..."
            aria-label="Search products"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={sort === option.value ? "default" : "outline"}
              onClick={() => updateParam({ sort: option.value })}
            >
              {option.label}
            </Button>
          ))}
          {(search || category) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push("/products")}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : error ? (
        <StateMessage
          icon={<AlertCircle className="size-6" />}
          title="Couldn't load products"
          description="Connect your Laravel API at GET /products to populate this page."
          action={
            <Button onClick={reload} variant="outline">
              Try again
            </Button>
          }
        />
      ) : !data || data.data.length === 0 ? (
        <StateMessage
          icon={<PackageSearch className="size-6" />}
          title="No products found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.last_page > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => updateParam({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.last_page}
                onClick={() => updateParam({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
