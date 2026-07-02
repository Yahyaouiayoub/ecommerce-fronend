"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Star,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MessageSquareQuote,
  ShoppingBag,
  CheckCheck,
  X,
  AlertCircle,
} from "lucide-react"
import {
  adminGetAllReviews,
  adminApproveReview,
  adminRejectReview,
  adminPendingReview,
  adminBulkApproveReviews,
  adminBulkRejectReviews,
  adminGetReviewModerationStats,
  adminGetReviewProducts,
} from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import type { Review, ReviewModerationStats } from "@/lib/types"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"
import { toast } from "sonner"

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
const STATUS_OPTS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const

export default function ReviewsModerationPage() {
  // Data
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewModerationStats | null>(null)
  const [products, setProducts] = useState<{ id: number; name: string; slug: string; reviews_count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [rating, setRating] = useState<number | "">("")
  const [productFilter, setProductFilter] = useState<number | "">("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, per_page: 20 }
      if (search) params.search = search
      if (status) params.status = status
      if (rating !== "") params.rating = rating
      if (productFilter !== "") params.product_id = productFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const res = await adminGetAllReviews(params as any)
      setReviews(res.data)
      setPage(res.current_page)
      setLastPage(res.last_page)
      setTotal(res.total)
      setSelectedIds(new Set())
      setSelectAll(false)
    } catch {
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, rating, productFilter, dateFrom, dateTo])

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminGetReviewModerationStats()
      setStats(s)
    } catch {}
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const p = await adminGetReviewProducts()
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

  // Individual actions
  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      const res = await adminApproveReview(id)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...res.data } : r)))
      fetchStats()
      toast.success("Review approved")
    } catch {
      toast.error("Failed to approve review")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionLoading(id)
    try {
      const res = await adminRejectReview(id)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...res.data } : r)))
      fetchStats()
      toast.success("Review rejected")
    } catch {
      toast.error("Failed to reject review")
    } finally {
      setActionLoading(null)
    }
  }

  const handlePending = async (id: number) => {
    setActionLoading(id)
    try {
      const res = await adminPendingReview(id)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...res.data } : r)))
      fetchStats()
      toast.success("Review moved to pending")
    } catch {
      toast.error("Failed to update review")
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await adminBulkApproveReviews(Array.from(selectedIds))
      fetchReviews()
      fetchStats()
      toast.success(res.message)
    } catch {
      toast.error("Bulk approve failed")
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await adminBulkRejectReviews(Array.from(selectedIds))
      fetchReviews()
      fetchStats()
      toast.success(res.message)
    } catch {
      toast.error("Bulk reject failed")
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReviews()
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)))
      setSelectAll(true)
    }
  }

  const statusBadge = (status: string) => {
    if (status === "approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          Approved
        </span>
      )
    if (status === "rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <XCircle className="size-3" />
          Rejected
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <Clock className="size-3" />
        Pending
      </span>
    )
  }

  const pendingCount = reviews.filter((r) => r.status === "pending").length

  return (
    <div className="px-4 lg:px-6 py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review Moderation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject customer reviews before they appear on the storefront
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium">{pendingCount} review{pendingCount !== 1 ? "s" : ""} pending moderation</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold">{stats.total_reviews}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-card p-4 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {stats.pending_reviews}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-card p-4 dark:border-emerald-800">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.approved_reviews}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-card p-4 dark:border-red-800">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejected</p>
            <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
              {stats.rejected_reviews}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Avg Rating</p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-2xl font-semibold">{stats.avg_rating.toFixed(1)}</p>
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

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="gap-1.5 h-8 text-xs"
              >
                {bulkLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                Approve All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkReject}
                disabled={bulkLoading}
                className="gap-1.5 h-8 text-xs"
              >
                {bulkLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                Reject All
              </Button>
            </div>
          )}
        </div>

          {showFilters && (
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card px-5 py-4">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                {STATUS_OPTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <select
                value={rating}
                onChange={(e) => { setRating(e.target.value ? Number(e.target.value) : ""); setPage(1) }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="">All Ratings</option>
                {RATINGS.map((r) => (
                  <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              <select
                value={productFilter}
                onChange={(e) => { setProductFilter(e.target.value ? Number(e.target.value) : ""); setPage(1) }}
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
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("")
                setRating("")
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
                <th className="w-10 px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border accent-accent"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Review</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-2 py-3"><Skeleton className="size-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="mx-auto h-5 w-24" /></td>
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
                reviews.map((review) => {
                  const isPending = review.status === "pending"
                  const isApproved = review.status === "approved"
                  const isRejected = review.status === "rejected"

                  return (
                    <tr
                      key={review.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        isPending ? "bg-amber-50/40 dark:bg-amber-950/10" : "",
                        isRejected ? "bg-red-50/30 dark:bg-red-950/10" : "",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(review.id)}
                          onChange={() => toggleSelect(review.id)}
                          className="size-4 rounded border-border accent-accent"
                        />
                      </td>

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

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {statusBadge(review.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <XCircle className="size-3.5" />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                          {isApproved && (
                            <>
                              <button
                                onClick={() => handlePending(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Clock className="size-3.5" />
                                )}
                                Unapprove
                              </button>
                              <button
                                onClick={() => handleReject(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <XCircle className="size-3.5" />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                          {isRejected && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handlePending(review.id)}
                                disabled={actionLoading === review.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-950/20 transition-colors"
                              >
                                {actionLoading === review.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Clock className="size-3.5" />
                                )}
                                Retry
                              </button>
                            </>
                          )}
                        </div>
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
