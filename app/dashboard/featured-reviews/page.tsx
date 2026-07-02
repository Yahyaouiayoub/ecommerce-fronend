"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Star,
  Filter,
  ChevronUp,
  ChevronDown,
  Loader2,
  MessageSquareQuote,
  ShoppingBag,
  EyeOff,
  Eye,
} from "lucide-react"
import {
  adminGetFeaturedReviews,
  adminToggleReviewFeatured,
  adminToggleFeaturedActive,
  adminReorderFeaturedReviews,
  adminGetFeaturedReviewStats,
  adminGetFeaturedReviewProducts,
} from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import type { Review, FeaturedReviewStats, FeaturedReviewProduct } from "@/lib/types"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"

function UserAvatar({ src, initials }: { src: string; initials: string }) {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
        {initials}
      </div>
    )
  }
  return (
    <img src={src} alt="" className="size-full object-cover" onError={() => setImgError(true)} />
  )
}

const RATINGS = [5, 4, 3, 2, 1]

export default function FeaturedReviewsPage() {
  const router = useRouter()

  // Data
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<FeaturedReviewStats | null>(null)
  const [products, setProducts] = useState<FeaturedReviewProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState("")
  const [rating, setRating] = useState<number | "">("")
  const [featuredFilter, setFeaturedFilter] = useState("")
  const [productFilter, setProductFilter] = useState<number | "">("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    if (showLoading) setError(null)
    try {
      const params: Record<string, unknown> = { page, per_page: 20 }
      if (search) params.search = search
      if (rating !== "") params.rating = rating
      if (featuredFilter) {
        if (featuredFilter === "featured") params.featured = "true"
        else if (featuredFilter === "not_featured") params.featured = "false"
      }
      if (productFilter !== "") params.product_id = productFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const res = await adminGetFeaturedReviews(params as any)
      setReviews(res.data)
      setPage(res.current_page)
      setLastPage(res.last_page)
      setTotal(res.total)
    } catch (err) {
      if (showLoading) setError("Failed to load reviews.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [page, search, rating, featuredFilter, productFilter, dateFrom, dateTo])

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminGetFeaturedReviewStats()
      setStats(s)
    } catch {}
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const p = await adminGetFeaturedReviewProducts()
      setProducts(p)
    } catch {}
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    fetchStats()
    fetchProducts()
  }, [fetchStats, fetchProducts])

  const handleToggleFeatured = async (id: number) => {
    setTogglingId(id)
    try {
      const res = await adminToggleReviewFeatured(id)
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...res.data } : r)),
      )
      fetchStats()
    } catch {}
    finally {
      setTogglingId(null)
    }
  }

  const handleToggleActive = async (id: number) => {
    setTogglingId(id)
    try {
      const res = await adminToggleFeaturedActive(id)
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...res.data } : r)),
      )
      fetchStats()
    } catch {}
    finally {
      setTogglingId(null)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    const items = reviews.filter((r) => r.is_featured)
    if (items.length < 2) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp

    const reorderPayload = newItems.map((r, i) => ({
      id: r.id,
      featured_order: i,
    }))

    // Optimistic update — reorder locally immediately
    setReviews((prev) =>
      prev.map((r) => {
        const updated = reorderPayload.find((p) => p.id === r.id)
        return updated ? { ...r, featured_order: updated.featured_order } : r
      }),
    )

    try {
      await adminReorderFeaturedReviews(reorderPayload)
    } catch {
      fetchReviews(false)
    }
  }

  const handleMoveDown = async (index: number) => {
    const items = reviews.filter((r) => r.is_featured)
    if (index >= items.length - 1) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp

    const reorderPayload = newItems.map((r, i) => ({
      id: r.id,
      featured_order: i,
    }))

    // Optimistic update — reorder locally immediately
    setReviews((prev) =>
      prev.map((r) => {
        const updated = reorderPayload.find((p) => p.id === r.id)
        return updated ? { ...r, featured_order: updated.featured_order } : r
      }),
    )

    try {
      await adminReorderFeaturedReviews(reorderPayload)
    } catch {
      fetchReviews(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReviews()
  }

  const featuredItems = reviews.filter((r) => r.is_featured)

  return (
    <div className="px-4 lg:px-6 py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Featured Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Manage which customer reviews appear on the homepage
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Reviews</p>
            <p className="mt-1 text-2xl font-semibold">{stats.totalReviews}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Featured</p>
            <p className="mt-1 text-2xl font-semibold text-amber-500">{stats.featuredReviews}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Active on Homepage</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-500">{stats.activeFeatured}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Avg Featured Rating</p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-2xl font-semibold">{stats.avgRatingFeatured.toFixed(1)}</p>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews, customers, products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </form>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="size-3.5" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card px-5 py-4">
            {/* Rating */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <select
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value ? Number(e.target.value) : "")
                  setPage(1)
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">All Ratings</option>
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Featured Status</label>
              <select
                value={featuredFilter}
                onChange={(e) => {
                  setFeaturedFilter(e.target.value)
                  setPage(1)
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">All Reviews</option>
                <option value="featured">Featured Only</option>
                <option value="not_featured">Not Featured</option>
              </select>
            </div>

            {/* Product */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value ? Number(e.target.value) : "")
                  setPage(1)
                }}
                className="flex h-9 max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.reviews_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRating("")
                setFeaturedFilter("")
                setProductFilter("")
                setDateFrom("")
                setDateTo("")
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Review</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Featured</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-14" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-14" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-14" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <MessageSquareQuote className="mx-auto size-8 mb-2 opacity-40" />
                    <p>No reviews found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                reviews.map((review, index) => {
                  const isFeatured = review.is_featured ?? false
                  const isActive = review.is_featured_active ?? true
                  const featuredIndex = featuredItems.findIndex((r) => r.id === review.id)

                  return (
                    <tr
                      key={review.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        isFeatured ? "bg-amber-50/30 dark:bg-amber-950/10" : "",
                      )}
                    >
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                            {review.user?.avatar ? (
                              <UserAvatar src={getImageUrl(review.user.avatar)} initials={review.user ? `${review.user.first_name[0]}${review.user.last_name[0]}` : "??"} />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                                {review.user
                                  ? `${review.user.first_name[0]}${review.user.last_name[0]}`
                                  : "??"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground text-xs">
                              {review.user
                                ? `${review.user.first_name} ${review.user.last_name}`
                                : "Unknown"}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {review.user?.email ?? ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                            {review.product?.thumbnail ? (
                              <img
                                src={review.product.thumbnail}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="size-full p-1.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate max-w-[140px] text-xs">
                            {review.product?.name ?? "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              className={cn(
                                "size-3",
                                s < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Review */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="truncate text-xs text-muted-foreground">
                          {review.comment ?? (
                            <span className="italic opacity-50">No comment</span>
                          )}
                        </p>
                      </td>

                      {/* Featured Toggle */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === review.id}
                          onClick={() => handleToggleFeatured(review.id)}
                          className={cn(
                            "h-7 px-2 text-xs gap-1",
                            isFeatured
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {togglingId === review.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Star
                              className={cn(
                                "size-3.5",
                                isFeatured ? "fill-amber-400" : "",
                              )}
                            />
                          )}
                          {isFeatured ? "Featured" : "Mark"}
                        </Button>
                      </td>

                      {/* Active Toggle */}
                      <td className="px-4 py-3 text-center">
                        {isFeatured ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === review.id}
                            onClick={() => handleToggleActive(review.id)}
                            className={cn(
                              "h-7 px-2 text-xs gap-1",
                              isActive
                                ? "text-emerald-600 hover:text-emerald-700"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {togglingId === review.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : isActive ? (
                              <Eye className="size-3.5" />
                            ) : (
                              <EyeOff className="size-3.5" />
                            )}
                            {isActive ? "Active" : "Hidden"}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Order Controls */}
                      <td className="px-4 py-3 text-center">
                        {isFeatured ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground w-4 text-center">
                              {review.featured_order ?? featuredIndex + 1}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMoveUp(featuredIndex)}
                                disabled={featuredIndex <= 0}
                                className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ChevronUp className="size-3" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(featuredIndex)}
                                disabled={featuredIndex >= featuredItems.length - 1}
                                className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ChevronDown className="size-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(review.created_at)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
            </p>
            <Pagination simple currentPage={page} lastPage={lastPage} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
