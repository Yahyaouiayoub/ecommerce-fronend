"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertCircle,
  Tag,
  Plus,
  Search,
  Percent,
  DollarSign,
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wand,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal"
import { useAuth } from "@/lib/hooks/use-auth"
import { adminGetCoupons, adminDeleteCoupon, adminToggleCouponActive, adminGetCouponStats, getPublicSettings } from "@/lib/api/services"
import { api as client } from "@/lib/api/client"
import { useApi } from "@/lib/hooks/use-api"
import { formatPrice } from "@/lib/utils"
import type { Coupon, CouponStats, PublicSettings } from "@/lib/types"
import { toast } from "sonner"

export default function AdminCouponsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<CouponStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deletingInProgress, setDeletingInProgress] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [togglingEnabled, setTogglingEnabled] = useState(false)

  const { data: publicSettings, reload: reloadSettings } = useApi<PublicSettings | null>(
    () => getPublicSettings(),
    [],
  )

  const couponsEnabled = publicSettings?.coupons_enabled ?? true

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  function loadCoupons() {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 20 }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.type = typeFilter

    adminGetCoupons(params)
      .then((res) => {
        setCoupons(res.data)
        setLastPage(res.last_page)
      })
      .catch(() => toast.error("Failed to load coupons"))
      .finally(() => setLoading(false))

    // Load stats once
    if (!stats) {
      adminGetCouponStats()
        .then(setStats)
        .catch(() => {})
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [page, statusFilter, typeFilter])

  function handleSearch() {
    setPage(1)
    loadCoupons()
  }

  async function handleToggleActive(id: number) {
    try {
      const res = await adminToggleCouponActive(id)
      setCoupons((prev) => prev.map((c) => (c.id === id ? res.coupon : c)))
      toast.success(res.message)
    } catch {
      toast.error("Failed to toggle coupon status")
    }
  }

  async function handleToggleEnabled() {
    setTogglingEnabled(true)
    try {
      const { data } = await client.put("/admin/coupons/toggle-enabled")
      toast.success(data.message)
      reloadSettings()
    } catch {
      toast.error("Failed to toggle coupon availability")
    } finally {
      setTogglingEnabled(false)
    }
  }

  function handleDelete(id: number, code: string) {
    setDeleteTarget({ id, name: code })
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeletingInProgress(true)
    setDeletingIds((prev) => [...prev, id])
    setCoupons((prev) => prev.filter((c) => c.id !== id))
    try {
      await adminDeleteCoupon(id)
      toast.success("Coupon deleted")
    } catch {
      loadCoupons()
      toast.error("Failed to delete coupon")
    } finally {
      setDeletingIds((prev) => prev.filter((did) => did !== id))
      setDeletingInProgress(false)
      setDeleteTarget(null)
    }
  }

  function handleCloseDeleteModal() {
    if (!deletingInProgress) {
      setDeleteTarget(null)
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats ? `${stats.active_coupons} active of ${stats.total_coupons} total` : "Manage discount coupons"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/coupons/new">
            <Plus className="size-4" />
            New coupon
          </Link>
        </Button>
      </div>

      {/* Global toggle */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {couponsEnabled ? (
              <ToggleRight className="size-6 text-green-600 dark:text-green-400" />
            ) : (
              <ToggleLeft className="size-6 text-neutral-400 dark:text-neutral-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                Coupons {couponsEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {couponsEnabled
                  ? "Customers can use coupon codes during checkout."
                  : "Coupon input is hidden during checkout. Existing coupons are preserved."}
              </p>
            </div>
          </div>
          <Button
            variant={couponsEnabled ? "outline" : "default"}
            size="sm"
            disabled={togglingEnabled}
            onClick={handleToggleEnabled}
          >
            {togglingEnabled ? "..." : couponsEnabled ? "Disable Coupons" : "Enable Coupons"}
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</p>
            <p className="mt-1 text-2xl font-bold">{stats.active_coupons}</p>
            <p className="mt-1 text-xs text-muted-foreground">of {stats.total_coupons} total</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Uses</p>
            <p className="mt-1 text-2xl font-bold">{stats.total_usage_count}</p>
            <p className="mt-1 text-xs text-muted-foreground">across all coupons</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount Given</p>
            <p className="mt-1 text-2xl font-bold">{formatPrice(stats.total_discount_given)}</p>
            <p className="mt-1 text-xs text-muted-foreground">total savings</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid Now</p>
            <p className="mt-1 text-2xl font-bold">{stats.valid_now_coupons}</p>
            <p className="mt-1 text-xs text-muted-foreground">ready to use</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by code..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="scheduled">Scheduled</option>
        </Select>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="">All types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </Select>
        <Button variant="outline" size="sm" onClick={loadCoupons} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <StateMessage
          icon={<Tag className="size-6" />}
          title="No coupons found"
          description={search || statusFilter || typeFilter ? "Try different filters." : "Create your first coupon to start offering discounts."}
          action={
            !search && !statusFilter && !typeFilter ? (
              <Button asChild>
                <Link href="/dashboard/coupons/new">
                  <Plus className="size-4" />
                  New coupon
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/coupons/${coupon.id}/edit`}
                    className="font-mono font-semibold text-foreground hover:text-accent transition-colors"
                  >
                    {coupon.code}
                  </Link>
                  <Badge variant={coupon.is_active ? "default" : "outline"}>
                    {coupon.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {coupon.is_auto_apply && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Wand className="size-3" />
                      Auto
                    </Badge>
                  )}
                  {coupon.is_expired && (
                    <Badge variant="outline" className="text-destructive border-destructive/30">Expired</Badge>
                  )}
                  <Badge variant="secondary">
                    {coupon.type === "percentage" ? (
                      <><Percent className="size-3 mr-0.5" />{coupon.value}%</>
                    ) : (
                      <><DollarSign className="size-3 mr-0.5" />{coupon.value.toFixed(2)}</>
                    )}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{coupon.usages_count ?? 0} use{(coupon.usages_count ?? 0) !== 1 ? "s" : ""}</span>
                  {coupon.usage_limit && (
                    <span>Limit: {coupon.usage_limit}</span>
                  )}
                  {coupon.applies_to === "specific" && (
                    <span>Specific products</span>
                  )}
                  {coupon.min_order_amount && (
                    <span>Min: {formatPrice(coupon.min_order_amount)}</span>
                  )}
                  {coupon.expires_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      Expires {new Date(coupon.expires_at).toLocaleDateString()}
                    </span>
                  )}
                  {coupon.description && (
                    <span className="text-muted-foreground/60 truncate max-w-[200px]">{coupon.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(coupon.id)}
                  title={coupon.is_active ? "Deactivate" : "Activate"}
                >
                  {coupon.is_active ? <XCircle className="size-4 text-amber-500" /> : <CheckCircle2 className="size-4 text-green-500" />}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/coupons/${coupon.id}/edit`}>Edit</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(coupon.id, coupon.code)}
                  className="text-destructive hover:text-destructive"
                  disabled={deletingIds.includes(coupon.id)}
                >
                  {deletingIds.includes(coupon.id) ? "..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}

          <Pagination simple currentPage={page} lastPage={lastPage} onPageChange={setPage} />
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Coupon"
          entityName={deleteTarget.name}
          warning="Customers who have saved this coupon code will no longer be able to use it. Historical usage data is preserved."
          loading={false}
          deleting={deletingInProgress}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
