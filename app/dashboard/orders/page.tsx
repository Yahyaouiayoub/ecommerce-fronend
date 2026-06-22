"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  AlertCircle,
  ShoppingCart,
  Search,
  X,
  ExternalLink,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { usePolling } from "@/lib/hooks/use-polling"
import { adminGetOrders } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectOrdersUpdating } from "@/lib/store"
import { updateOrderStatus, optimisticStatusUpdate, rollbackOrder } from "@/lib/store/orders-slice"
import type { Order } from "@/lib/types"
import { toast } from "sonner"

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
}

const paymentStatusBadge = (paymentMethod: string, invoices?: { status: string }[]) => {
  if (!invoices || invoices.length === 0) {
    return <Badge variant="outline">No invoice</Badge>
  }
  const allPaid = invoices.every((inv) => inv.status === "paid")
  const somePaid = invoices.some((inv) => inv.status === "paid" || inv.status === "partially_paid")

  if (allPaid) return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200">Paid</Badge>
  if (somePaid) return <Badge variant="secondary">Partial</Badge>
  return <Badge variant="outline">Unpaid</Badge>
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Filters
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const dispatch = useAppDispatch()
  const reduxUpdatingIds = useAppSelector(selectOrdersUpdating)
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<number, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [statusFilter, search, dateFrom, dateTo])

  const { data, loading, error, reload } = useApi<Order[]>(
    () => adminGetOrders(Object.keys(queryParams).length > 0 ? queryParams : undefined),
    [queryParams],
  )

  // Auto-poll orders every 30 seconds
  usePolling(reload, 30_000)

  // Apply client-side payment status filter
  const filteredData = useMemo(() => {
    if (!data) return data
    if (!paymentStatusFilter) return data
    return data.filter((order) => {
      const invoices = order.invoices ?? []
      if (invoices.length === 0) return paymentStatusFilter === "unpaid"
      const allPaid = invoices.every((inv) => inv.status === "paid")
      const somePaid = invoices.some((inv) => inv.status === "paid" || inv.status === "partially_paid")
      if (paymentStatusFilter === "paid") return allPaid
      if (paymentStatusFilter === "unpaid") return !somePaid
      if (paymentStatusFilter === "partial") return !allPaid && somePaid
      return true
    })
  }, [data, paymentStatusFilter])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  async function handleStatusUpdate(orderId: number, newStatus: string) {
    if (newStatus === "cancelled") {
      const confirmed = window.confirm("Cancel this order? This will restore product stock.")
      if (!confirmed) return
    }
    
    // Save previous order state for rollback
    const order = displayOrders.find((o) => o.id === orderId)
    
    // Optimistic update — update UI immediately
    setOptimisticStatuses((prev) => ({ ...prev, [orderId]: newStatus }))
    dispatch(optimisticStatusUpdate({ id: orderId, status: newStatus }))
    
    try {
      // Send API request in background
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap()
      toast.success(`Order marked as ${newStatus}`)
    } catch (err) {
      // Rollback on error
      setOptimisticStatuses((prev) => {
        const next = { ...prev }
        delete next[orderId]
        return next
      })
      if (order) {
        dispatch(rollbackOrder({ id: orderId, previous: order }))
      }
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    }
  }

  const clearFilters = () => {
    setStatusFilter("")
    setPaymentStatusFilter("")
    setSearch("")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = statusFilter || paymentStatusFilter || search || dateFrom || dateTo

  if (authLoading) return null

  // Group/dashboard split
  const displayOrders = filteredData ?? data ?? []
  const pendingOrders = displayOrders.filter((o) => o.status === "pending" || o.status === "processing")
  const otherOrders = displayOrders.filter((o) => o.status !== "pending" && o.status !== "processing")

  return (      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data ? `${data.length} order${data.length !== 1 ? "s" : ""}` : "Manage customer orders"}
              {hasActiveFilters && data && ` — filtered`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="size-4" />
              Filters
              {hasActiveFilters && <span className="ml-1.5 size-1.5 rounded-full bg-accent" />}
            </Button>
            <Button variant="outline" onClick={reload}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-32 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="min-w-32 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Status</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All payments</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="min-w-40 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Search customer</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name, email, order #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load orders"
            action={<Button onClick={reload} variant="outline">Try again</Button>}
          />
        ) : !data || data.length === 0 ? (
          <StateMessage
            icon={<ShoppingCart className="size-6" />}
            title="No orders found"
            description={hasActiveFilters ? "Try adjusting your filters." : "Orders will appear here once customers start purchasing."}
            action={hasActiveFilters ? <Button onClick={clearFilters} variant="outline">Clear filters</Button> : undefined}
          />
        ) : (
          <>
            {/* Active orders section */}
            {pendingOrders.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Active orders ({pendingOrders.length})
                </h2>
                <div className="space-y-3">
                  {pendingOrders.map((order) => renderOrderCard(order))}
                </div>
              </div>
            )}

            {/* Completed / other orders */}
            {otherOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {pendingOrders.length > 0 ? "Completed & cancelled" : "All orders"} ({otherOrders.length})
                </h2>
                <div className="space-y-2">
                  {otherOrders.map((order) => renderOrderCard(order, true))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
  )

  function renderOrderCard(order: Order, compact = false) {
    return (
      <div
        key={order.id}
        className={`rounded-xl border border-border bg-card transition-shadow hover:shadow-sm ${
          compact ? "py-3" : "py-4"
        }`}
      >
        <div className="px-4">
          {/* Top row: order info + status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ShoppingCart className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="font-semibold hover:underline truncate"
                  >
                    #{order.order_number}
                  </Link>
                  <Badge className={statusStyles[optimisticStatuses[order.id] ?? order.status] ?? ""}>
                    {optimisticStatuses[order.id] ?? order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-base font-semibold">{formatPrice(order.total_price)}</p>
                <div className="flex items-center gap-1.5 justify-end">
                  {paymentStatusBadge(order.payment_method, order.invoices)}
                  <span className="text-xs text-muted-foreground">
                    {order.payment_method === "cod" ? "COD" : "Card"}
                  </span>
                </div>
              </div>

              <Link
                href={`/dashboard/orders/${order.id}`}
                className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Middle row: customer + shipping */}
          {!compact && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium truncate">
                  {order.address?.full_name ?? order.user?.full_name ?? "N/A"}
                </span>
                {order.user?.email && (
                  <span className="text-muted-foreground text-xs hidden sm:inline">
                    ({order.user.email})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm sm:justify-end">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{order.items?.length ?? 0} product{(order.items?.length ?? 0) !== 1 ? "s" : ""}</span>
                {order.address?.city && (
                  <span className="text-muted-foreground text-xs hidden sm:inline">
                    → {order.address.city}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bottom row: actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              {STATUS_TRANSITIONS[optimisticStatuses[order.id] ?? order.status]?.length > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground">Update:</span>
                  <div className="flex gap-1">
                    {STATUS_TRANSITIONS[optimisticStatuses[order.id] ?? order.status].map((s) => (
                      <Button
                        key={s}
                        size="xs"
                        variant={s === "cancelled" ? "destructive" : "outline"}
                        disabled={reduxUpdatingIds.includes(order.id)}
                        onClick={() => handleStatusUpdate(order.id, s)}
                      >
                        {reduxUpdatingIds.includes(order.id) ? "..." : s === "cancelled" ? "Cancel" : `Mark ${s}`}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (optimisticStatuses[order.id] ?? order.status) === "delivered" ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200">
                  ✓ Completed
                </Badge>
              ) : null}
            </div>
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              View details →
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
