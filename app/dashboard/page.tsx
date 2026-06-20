"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  LayoutDashboard,
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
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { getDashboardStats, getFinancialDashboard } from "@/lib/api/services"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const { user, loading } = useAuth()
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>(
    () => getDashboardStats(),
    [],
  )
  const { data: financial, loading: financialLoading } = useApi<FinancialDashboardData | null>(
    () => getFinancialDashboard(),
    [],
  )

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      router.replace("/profile")
    }
  }, [user, loading, router])

  if (loading) {
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
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StateMessage
          icon={<LayoutDashboard className="size-6" />}
          title="Access denied"
          description="You need admin privileges to access this page."
          action={
            <Link
              href="/"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Back to home
            </Link>
          }
        />
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
        </div>

        {statsLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Revenue & Order Stats Cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Total Revenue */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Revenue
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <DollarSign className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{formatPrice(stats.total_revenue)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Net: {formatPrice(stats.net_revenue)}
                </p>
              </div>

              {/* Revenue This Month */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    This Month
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <Calendar className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{formatPrice(stats.revenue_this_month)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats.total_revenue > 0
                    ? `${((stats.revenue_this_month / stats.total_revenue) * 100).toFixed(1)}% of total`
                    : "No revenue yet"}
                </p>
              </div>

              {/* Revenue Today */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Today
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                    <Clock className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{formatPrice(stats.revenue_today)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats.revenue_this_month > 0
                    ? `${((stats.revenue_today / stats.revenue_this_month) * 100).toFixed(1)}% of month`
                    : "Today's collections"}
                </p>
              </div>

              {/* Total Orders */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Orders
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <ShoppingCart className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{stats.total_orders}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats.delivered_orders} delivered · {stats.cancelled_orders} cancelled
                </p>
              </div>

              {/* Delivered Orders */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Delivered
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{stats.delivered_orders}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats.total_orders > 0
                    ? `${((stats.delivered_orders / stats.total_orders) * 100).toFixed(0)}% completion rate`
                    : "No orders yet"}
                </p>
              </div>

              {/* Pending Orders */}
              <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pending
                  </p>
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Clock className="size-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold">{stats.pending_orders}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stats.processing_orders} processing · {stats.shipped_orders} shipped
                </p>
              </div>
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

            {/* Financial Overview Section */}
            {financial && !financialLoading && (
              <>
                <Separator className="my-8" />
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <PiggyBank className="size-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold tracking-tight">Financial Overview</h2>
                  </div>

                  {/* Financial Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {/* Revenue */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                          <TrendingUp className="size-3.5" />
                        </div>
                      </div>
                      <p className="mt-3 text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(financial.total_revenue)}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">From paid invoices</p>
                    </div>

                    {/* Expenses */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expenses</p>
                        <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                          <TrendingDown className="size-3.5" />
                        </div>
                      </div>
                      <p className="mt-3 text-xl font-bold text-red-600 dark:text-red-400">{formatPrice(financial.total_expenses)}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">All recorded expenses</p>
                    </div>

                    {/* Net Profit */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
                        <div className={`flex size-7 items-center justify-center rounded-lg ${
                          financial.net_profit >= 0
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          <PiggyBank className="size-3.5" />
                        </div>
                      </div>
                      <p className={`mt-3 text-xl font-bold ${
                        financial.net_profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {financial.net_profit >= 0 ? "" : "-"}{formatPrice(Math.abs(financial.net_profit))}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {financial.total_revenue > 0
                          ? `${((financial.net_profit / financial.total_revenue) * 100).toFixed(1)}% margin`
                          : "No revenue yet"}
                      </p>
                    </div>

                    {/* Pending Payments */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Payments</p>
                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                          <HandCoins className="size-3.5" />
                        </div>
                      </div>
                      <p className="mt-3 text-xl font-bold text-amber-600 dark:text-amber-400">{formatPrice(financial.pending_payments)}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Remaining on invoices</p>
                    </div>

                    {/* Unpaid Invoices */}
                    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unpaid Invoices</p>
                        <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                          <Receipt className="size-3.5" />
                        </div>
                      </div>
                      <p className="mt-3 text-xl font-bold">{financial.unpaid_invoices}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {financial.collection_rate.total_count > 0
                          ? `${financial.collection_rate.paid_count} paid of ${financial.collection_rate.total_count} total`
                          : "No invoices yet"}
                      </p>
                    </div>
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
                    View all →
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
