"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import {
  AlertCircle,
  PackageSearch,
  SlidersHorizontal,
  X,
  Star,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react"
import { getProducts, getCategories, getBrands, getProductPriceRange, type ProductQuery } from "@/lib/api/services"
import { useApi, useSharedData } from "@/lib/hooks/use-api"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { PriceRangeSlider } from "@/components/price-range-slider"
import type { Category, Brand } from "@/lib/types"
import { cn } from "@/lib/utils"

const SORT_OPTIONS: { value: NonNullable<ProductQuery["sort"]>; label: string; icon?: React.ReactNode }[] = [
  { value: "newest", label: "Newest", icon: null },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Reviewed", icon: <Star className="size-3.5" /> },
]

export function ProductsBrowser() {
  const router = useRouter()
  const params = useSearchParams()

  const search = params.get("search") ?? ""
  const categoryId = params.get("category_id") ?? ""
  const brandId = params.get("brand_id") ?? ""
  const sort = (params.get("sort") as ProductQuery["sort"]) ?? "newest"
  const page = Number(params.get("page") ?? "1")
  const newArrivals = params.get("new_arrivals") === "true"
  const bestSellers = params.get("best_sellers") === "true"
  const minPriceParam = params.get("min_price")
  const maxPriceParam = params.get("max_price")
  const hasPriceFilter = !!(minPriceParam || maxPriceParam)

  const [priceRangeOpen, setPriceRangeOpen] = useState(hasPriceFilter)

  // Load categories, brands, and price range for filters (shared singletons)
  const { data: categories } = useSharedData<Category[]>("categories", getCategories)
  const { data: brands } = useSharedData<Brand[]>("brands", getBrands)
  const { data: priceRange } = useSharedData<{ min_price: number; max_price: number }>("priceRange", getProductPriceRange)

  const dbMin = priceRange?.min_price ?? 0
  const dbMax = priceRange?.max_price ?? 10000

  // Debounced search input (local state, not URL — avoids navigation on every keystroke)
  const [searchInput, setSearchInput] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync searchInput when URL search param changes externally
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam({ search: value || null })
    }, 400)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Local price range state — sync with URL params or defaults
  const [priceValue, setPriceValue] = useState<[number, number]>([
    minPriceParam ? Number(minPriceParam) : dbMin,
    maxPriceParam ? Number(maxPriceParam) : dbMax,
  ])

  // Sync price range when the backend data loads
  useEffect(() => {
    if (priceRange) {
      setPriceValue((prev) => {
        const newMin = minPriceParam ? Number(minPriceParam) : dbMin
        const newMax = maxPriceParam ? Number(maxPriceParam) : dbMax
        if (prev[0] !== newMin || prev[1] !== newMax) {
          return [newMin, newMax]
        }
        return prev
      })
    }
  }, [priceRange, minPriceParam, maxPriceParam, dbMin, dbMax])

  const query: ProductQuery = useMemo(
    () => ({
      search: search || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      brand_id: brandId ? Number(brandId) : undefined,
      sort,
      page,
      per_page: 12,
      new_arrivals: newArrivals || undefined,
      best_sellers: bestSellers || undefined,
      min_price: minPriceParam ? Number(minPriceParam) : undefined,
      max_price: maxPriceParam ? Number(maxPriceParam) : undefined,
    }),
    [search, categoryId, brandId, sort, page, newArrivals, bestSellers, minPriceParam, maxPriceParam],
  )

  const { data, loading, error, reload } = useApi(
    () => getProducts(query),
    [search, categoryId, brandId, sort, page, newArrivals, bestSellers, minPriceParam, maxPriceParam],
    { keepPreviousData: true },
  )

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      if (!("page" in updates)) next.delete("page")
      router.push(`/products?${next.toString()}`)
    },
    [params, router],
  )

  function handlePriceChange(value: [number, number]) {
    setPriceValue(value)
  }

  function applyPriceFilter() {
    updateParam({
      min_price: priceValue[0] > dbMin ? String(priceValue[0]) : null,
      max_price: priceValue[1] < dbMax ? String(priceValue[1]) : null,
    })
  }

  function clearPriceFilter() {
    setPriceValue([dbMin, dbMax])
    updateParam({ min_price: null, max_price: null })
    setPriceRangeOpen(true)
  }

  // Determine active filter label
  let activeFilterLabel = "All products"
  if (categoryId && categories) {
    const cat = categories.find((c) => c.id === Number(categoryId))
    if (cat) activeFilterLabel = cat.name
  }
  if (newArrivals) activeFilterLabel = "New Arrivals"
  if (bestSellers) activeFilterLabel = "Best Sellers"

  const hasActiveFilters = !!(
    search ||
    categoryId ||
    brandId ||
    newArrivals ||
    bestSellers ||
    sort !== "newest" ||
    hasPriceFilter
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {activeFilterLabel}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {data ? `${data.total} products available` : "Browse our collection."}
        </p>
      </header>

      {/* Filters & Controls */}
      <div className="mb-8 space-y-4">
        {/* Search row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-sm">
            <Input
              value={searchInput}
              onChange={handleSearchInput}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
            <Select
              value={sort}
              onChange={(e) => updateParam({ sort: e.target.value })}
              className="min-w-[160px]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category dropdown */}
          <Select
            value={categoryId}
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                updateParam({ category_id: null })
              } else {
                updateParam({ category_id: val, new_arrivals: null, best_sellers: null })
              }
            }}
          >
            <option value="">All categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {/* Brand dropdown */}
          <Select
            value={brandId}
            onChange={(e) => {
              const val = e.target.value
              if (!val) {
                updateParam({ brand_id: null })
              } else {
                updateParam({ brand_id: val })
              }
            }}
          >
            <option value="">All brands</option>
            {brands?.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>

          {/* Price range toggle button */}
          <Button
            size="sm"
            variant={hasPriceFilter ? "default" : "outline"}
            onClick={() => setPriceRangeOpen(!priceRangeOpen)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="size-3.5" />
            Price
            {hasPriceFilter && <span className="ml-0.5 size-1.5 rounded-full bg-current" />}
          </Button>

          <span className="mx-1 h-5 w-px bg-border" />

          {/* New Arrivals */}
          <Button
            size="sm"
            variant={newArrivals ? "default" : "secondary"}
            onClick={() => {
              if (newArrivals) {
                updateParam({ new_arrivals: null })
              } else {
                updateParam({ new_arrivals: "true", category_id: null, best_sellers: null })
              }
            }}
          >
            New Arrivals
          </Button>

          {/* Best Sellers */}
          <Button
            size="sm"
            variant={bestSellers ? "default" : "secondary"}
            onClick={() => {
              if (bestSellers) {
                updateParam({ best_sellers: null })
              } else {
                updateParam({ best_sellers: "true", category_id: null, new_arrivals: null })
              }
            }}
            className="gap-1.5"
          >
            <TrendingUp className="size-3.5" />
            Best Sellers
          </Button>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push("/products")}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Price range slider (collapsible) */}
        {priceRangeOpen && (
          <div className="rounded-xl border border-border bg-card p-5 max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Price Range</h3>
              {hasPriceFilter && (
                <button
                  onClick={clearPriceFilter}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <PriceRangeSlider
              min={dbMin}
              max={dbMax}
              step={10}
              value={priceValue}
              onChange={handlePriceChange}
            />
            <div className="mt-3 flex justify-between gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Min
                </label>
                <Input
                  type="number"
                  min={dbMin}
                  max={priceValue[1]}
                  step={10}
                  value={priceValue[0]}
                  onChange={(e) => {
                    const v = Math.max(dbMin, Math.min(Number(e.target.value), priceValue[1]))
                    setPriceValue([v, priceValue[1]])
                  }}
                  className="text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Max
                </label>
                <Input
                  type="number"
                  min={priceValue[0]}
                  max={dbMax}
                  step={10}
                  value={priceValue[1]}
                  onChange={(e) => {
                    const v = Math.max(priceValue[0], Math.min(Number(e.target.value), dbMax))
                    setPriceValue([priceValue[0], v])
                  }}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  onClick={applyPriceFilter}
                  variant="default"
                  disabled={priceValue[0] === dbMin && priceValue[1] === dbMax}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {search && (
              <FilterTag label={`"${search}"`} onRemove={() => updateParam({ search: null })} />
            )}
            {categoryId && categories && (
              <FilterTag
                label={categories.find((c) => c.id === Number(categoryId))?.name ?? "Category"}
                onRemove={() => updateParam({ category_id: null })}
              />
            )}
            {brandId && brands && (
              <FilterTag
                label={brands.find((b) => b.id === Number(brandId))?.name ?? "Brand"}
                onRemove={() => updateParam({ brand_id: null })}
              />
            )}
            {minPriceParam && (
              <FilterTag
                label={`Min: ${Number(minPriceParam).toFixed(0)} MAD`}
                onRemove={() => updateParam({ min_price: null })}
              />
            )}
            {maxPriceParam && (
              <FilterTag
                label={`Max: ${Number(maxPriceParam).toFixed(0)} MAD`}
                onRemove={() => updateParam({ max_price: null })}
              />
            )}
            {sort !== "newest" && (
              <FilterTag
                label={SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort}
                onRemove={() => updateParam({ sort: "newest" })}
              />
            )}
            {newArrivals && (
              <FilterTag label="New Arrivals" onRemove={() => updateParam({ new_arrivals: null })} />
            )}
            {bestSellers && (
              <FilterTag label="Best Sellers" onRemove={() => updateParam({ best_sellers: null })} />
            )}
          </div>
        )}
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

// =========================
// Filter Tag Chip
// =========================
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-background",
        "px-2.5 py-0.5 text-xs font-medium text-foreground",
        "transition-colors hover:bg-muted",
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
