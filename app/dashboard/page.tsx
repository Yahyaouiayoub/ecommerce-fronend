"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useCallback, useRef, useState } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Clock,
  PiggyBank,
  HandCoins,
  Receipt,
  ShoppingCart,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  useDashboardStats,
  useFinancialData,
  useDashboardRefresh,
} from "@/lib/hooks/use-dashboard-queries"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnimatedCounter } from "@/components/animated-counter"
import { formatPrice } from "@/lib/utils"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrdersChart } from "@/components/dashboard/orders-chart"
import { RevenueVsExpensesChart } from "@/components/dashboard/revenue-vs-expenses-chart"
import { MonthlyProfitChart } from "@/components/dashboard/monthly-profit-chart"
import { CollectionRateChart } from "@/components/dashboard/collection-rate-chart"
import { CartAnalytics } from "@/components/dashboard/cart-analytics"
import type { DashboardStats, FinancialDashboardData } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // ── React Query hooks ─────────────────────────────────────────
  // These replace the old useApi() calls. Benefits:
  //   - Automatic request deduplication (no need for manual inflight cache)
  //   - Background refetch without showing loading spinners
  //   - Shared cache across components (no double-fetching)
  //   - Proper stale-while-revalidate pattern
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isError: statsError,
  } = useDashboardStats()

  const {
    data: financial,
  } = useFinancialData()

  const { refreshAll } = useDashboardRefresh()

  // Track manual refresh animation separately from background refetches
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Manual refresh (silent background update) ─────────────────
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 3000)
    refreshAll()
  }, [refreshAll])

  // ── Auto-poll every 2 minutes (visibility-aware) ──────────────
  // Polls in the background using React Query's cache invalidation
  // so the user never sees a loading spinner. Pauses when the tab
  // is hidden to save bandwidth, resumes on return.
  useEffect(() => {
    function startPolling() {
      // Fire once immediately on visibility change
      refreshAll()
      intervalRef.current = setInterval(refreshAll, 2 * 60 * 1000)
    }

    function stopPolling() {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    const intervalRef: { current: ReturnType<typeof setInterval> | undefined } = { current: undefined }

    // Start polling if tab is visible
    if (!document.hidden) {
      startPolling()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      clearTimeout(refreshTimerRef.current)
    }
  }, [refreshAll])

  // ── Auth guard ────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login")
      } else if (user.role !== "admin") {
        router.replace("/profile")
      }
    }
  }, [authLoading, user, router])

  // ── Loading state (only on initial page load) ─────────────────
  if (authLoading || (statsLoading && !stats)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  // ── Error state ───────────────────────────────────────────────
  if (statsError && !stats) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back, {user.first_name}. Here&apos;s your store overview.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
        <div className="mt-8">
          <StateMessage
            icon={<TrendingUp className="size-6" />}
            title="Could not load stats"
            description="Make sure your Laravel API is running and seeded with data."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user.first_name}. Here&apos;s your store overview.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={handleRefresh}
          className="gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Data section — only render if we have stats */}
      {stats ? (
        <>
          {/* Revenue & Order Stats Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Revenue"
              icon={<DollarSign className="size-3.5" />}
              iconClass="bg-emerald-500/10 text-emerald-500"
              value={<AnimatedCounter value={stats.total_revenue} formatCurrency />}
              note={`Net: ${formatPrice(stats.net_revenue)}`}
            />
            <StatCard
              label="This Month"
              icon={<Calendar className="size-3.5" />}
              iconClass="bg-green-500/10 text-green-500"
              value={<AnimatedCounter value={stats.revenue_this_month} formatCurrency />}
              note={
                stats.total_revenue > 0
                  ? `${((stats.revenue_this_month / stats.total_revenue) * 100).toFixed(1)}% of total`
                  : "No revenue yet"
              }
            />
            <StatCard
              label="Today"
              icon={<Clock className="size-3.5" />}
              iconClass="bg-teal-500/10 text-teal-500"
              value={<AnimatedCounter value={stats.revenue_today} formatCurrency />}
              note={
                stats.revenue_this_month > 0
                  ? `${((stats.revenue_today / stats.revenue_this_month) * 100).toFixed(1)}% of month`
                  : "Today's collections"
              }
            />
            <StatCard
              label="Total Orders"
              icon={<ShoppingCart className="size-3.5" />}
              iconClass="bg-blue-500/10 text-blue-500"
              value={<AnimatedCounter value={stats.total_orders} />}
              note={`${stats.delivered_orders} delivered · ${stats.cancelled_orders} cancelled`}
            />
            <StatCard
              label="Delivered"
              icon={<TrendingUp className="size-3.5" />}
              iconClass="bg-emerald-500/10 text-emerald-500"
              value={<AnimatedCounter value={stats.delivered_orders} />}
              note={
                stats.total_orders > 0
                  ? `${((stats.delivered_orders / stats.total_orders) * 100).toFixed(0)}% completion rate`
                  : "No orders yet"
              }
            />
            <StatCard
              label="Pending"
              icon={<Clock className="size-3.5" />}
              iconClass="bg-amber-500/10 text-amber-500"
              value={<AnimatedCounter value={stats.pending_orders} />}
              note={`${stats.processing_orders} processing · ${stats.shipped_orders} shipped`}
            />
          </div>

          {/* Cart Analytics Row */}
          <div className="mt-6">
            <CartAnalytics
              data={{
                total_carts: stats.total_carts,
                active_carts: stats.active_carts,
                abandoned_carts: stats.abandoned_carts,
                converted_carts: stats.converted_carts,
              }}
            />
          </div>

          {/* Charts Row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RevenueChart data={stats.revenue_by_month} />
            <OrdersChart data={stats.orders_by_month} />
          </div>

          {/* Inventory Alerts */}
          {(stats.low_stock_products > 0 || stats.out_of_stock > 0) && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-5" />
                <span className="font-medium">Inventory alerts</span>
              </div>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                {stats.out_of_stock > 0 && (
                  <p>{stats.out_of_stock} product{stats.out_of_stock > 1 ? "s are" : " is"} out of stock.</p>
                )}
                {stats.low_stock_products > 0 && (
                  <p>{stats.low_stock_products} product{stats.low_stock_products > 1 ? "s have" : " has"} low stock (≤5).</p>
                )}
              </div>
            </div>
          )}

          {/* Invoice Statistics Section */}
          {stats.total_invoices > 0 && (
            <>
              <Separator className="my-8" />
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold tracking-tight">Invoice Overview</h2>
                  </div>
                  <Link
                    href="/dashboard/invoices"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    View all invoices <ChevronRight className="size-3 inline" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  <InvoiceStatCard label="Total" value={<AnimatedCounter value={stats.total_invoices} />} />
                  <InvoiceStatCard label="Paid" value={<AnimatedCounter value={stats.paid_invoices} />} />
                  <InvoiceStatCard label="Pending" value={<AnimatedCounter value={stats.pending_invoices} />} />
                  <InvoiceStatCard label="Refunded" value={<AnimatedCounter value={stats.refunded_invoices} />} />
                  <InvoiceStatCard label="Failed" value={<AnimatedCounter value={stats.failed_invoices} />} />
                  <InvoiceStatCard label="Cancelled" value={<AnimatedCounter value={stats.cancelled_invoices} />} />
                  <InvoiceStatCard
                    label="Revenue"
                    value={<AnimatedCounter value={stats.total_revenue} formatCurrency />}
                  />
                </div>
              </div>
            </>
          )}

          {/* Financial Overview Section */}
          {financial && (
            <>
              <Separator className="my-8" />
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <PiggyBank className="size-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold tracking-tight">Financial Overview</h2>
                </div>

                {/* Financial Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <StatCard
                    label="Revenue"
                    icon={<TrendingUp className="size-3.5" />}
                    iconClass="bg-emerald-500/10 text-emerald-500"
                    value={
                      <span className="text-emerald-600 dark:text-emerald-400">
                        <AnimatedCounter value={financial.total_revenue} formatCurrency />
                      </span>
                    }
                    note="From paid invoices"
                  />
                  <StatCard
                    label="Expenses"
                    icon={<TrendingDown className="size-3.5" />}
                    iconClass="bg-red-500/10 text-red-500"
                    value={
                      <span className="text-red-600 dark:text-red-400">
                        <AnimatedCounter value={financial.total_expenses} formatCurrency />
                      </span>
                    }
                    note="All recorded expenses"
                  />
                  <StatCard
                    label="Net Profit"
                    icon={<PiggyBank className="size-3.5" />}
                    iconClass={
                      financial.net_profit >= 0
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }
                    value={
                      <span className={
                        financial.net_profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }>
                        {financial.net_profit >= 0 ? "" : "-"}
                        <AnimatedCounter value={Math.abs(financial.net_profit)} formatCurrency />
                      </span>
                    }
                    note={
                      financial.total_revenue > 0
                        ? `${((financial.net_profit / financial.total_revenue) * 100).toFixed(1)}% margin`
                        : "No revenue yet"
                    }
                  />
                  <StatCard
                    label="Pending Payments"
                    icon={<HandCoins className="size-3.5" />}
                    iconClass="bg-amber-500/10 text-amber-500"
                    value={
                      <span className="text-amber-600 dark:text-amber-400">
                        <AnimatedCounter value={financial.pending_payments} formatCurrency />
                      </span>
                    }
                    note="Remaining on invoices"
                  />
                  <StatCard
                    label="Unpaid Invoices"
                    icon={<Receipt className="size-3.5" />}
                    iconClass="bg-red-500/10 text-red-500"
                    value={<AnimatedCounter value={financial.unpaid_invoices} />}
                    note={
                      financial.collection_rate.total_count > 0
                        ? `${financial.collection_rate.paid_count} paid of ${financial.collection_rate.total_count} total`
                        : "No invoices yet"
                    }
                  />
                </div>

                {/* Financial Charts */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  <RevenueVsExpensesChart data={financial.revenue_vs_expenses} />
                  <MonthlyProfitChart data={financial.monthly_profit} />
                  <CollectionRateChart data={financial.collection_rate} />
                </div>
              </div>
            </>
          )}

          {/* Recent orders */}
          {stats.recent_orders.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Recent orders</h2>
                <Link
                  href="/dashboard/orders"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  View all <ChevronRight className="size-3 inline" />
                </Link>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Order</th>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{order.customer}</td>
                        <td className="px-4 py-3">{formatPrice(order.total_price)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            order.status === "delivered" ? "default" :
                            order.status === "cancelled" ? "destructive" :
                            order.status === "pending" ? "secondary" : "outline"
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8">
          <StateMessage
            icon={<TrendingUp className="size-6" />}
            title="Could not load stats"
            description="Make sure your Laravel API is running and seeded with data."
          />
        </div>
      )}
    </div>
  )
}

// =========================
// Sub-components
// =========================

function StatCard({
  label,
  icon,
  iconClass,
  value,
  note,
}: {
  label: string
  icon: React.ReactNode
  iconClass: string
  value: React.ReactNode
  note: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl ${iconClass} opacity-80`} />
      
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className={`flex size-8 items-center justify-center rounded-lg ${iconClass} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground/80 border-t border-border/50 pt-2">
        {note}
      </p>
    </div>
  )
}

function InvoiceStatCard({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-border" />
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
        {value}
      </p>
    </div>
  )
}
