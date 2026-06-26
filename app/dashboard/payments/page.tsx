"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  CreditCard,
  Search,
  X,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { adminGetPayments } from "@/lib/api/services"
import type { Payment, PaginatedResponse } from "@/lib/types"

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Filters
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {}
    if (paymentMethodFilter) params.payment_method = paymentMethodFilter
    if (search) params.search = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    params.page = page
    params.per_page = 20
    return params
  }, [paymentMethodFilter, search, dateFrom, dateTo, page])

  const { data, loading, error, reload } = useApi<PaginatedResponse<Payment>>(
    () => adminGetPayments(queryParams as any),
    [queryParams],
  )

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  const clearFilters = () => {
    setPaymentMethodFilter("")
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const hasActiveFilters = paymentMethodFilter || search || dateFrom || dateTo

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.total} total payments`
              : "View all payments across orders"}
            {hasActiveFilters && " — filtered"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="size-3.5" />
            Filters
            {hasActiveFilters && <span className="ml-0.5 size-1.5 rounded-full bg-muted-foreground" />}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-32 flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Method
              </label>
              <Select
                value={paymentMethodFilter}
                onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1) }}
              >
                <option value="">All methods</option>
                <option value="cod">Cash on Delivery</option>
                <option value="card">Card</option>
              </Select>
            </div>
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Invoice#, order#..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                From
              </label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-36" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                To
              </label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-36" />
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
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6">
          <StateMessage
            icon={<CreditCard className="size-6" />}
            title="Could not load payments"
            description="There was a problem fetching payments. Please try again."
            action={
              <Button variant="outline" size="sm" onClick={reload}>Try again</Button>
            }
          />
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="mt-6">
          <StateMessage
            icon={<CreditCard className="size-6" />}
            title={hasActiveFilters ? "No payments match your filters" : "No payments yet"}
            description={hasActiveFilters ? "Try adjusting your filters." : "Payments appear when orders are placed and paid."}
            action={hasActiveFilters ? <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        </div>
      ) : (
        <>
          {/* Payments table */}
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3.5 text-sm font-medium">
                      {payment.payment_type_label}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/invoices/${payment.invoice_id}`}
                        className="text-accent hover:underline"
                      >
                        #{payment.invoice_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-sm capitalize text-muted-foreground">
                      {payment.payment_method === "cod" ? "Cash on Delivery" : "Card"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">
                      {payment.amount_formatted}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        payment.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          payment.status === "paid" ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                        {payment.status_label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })
                        : new Date(payment.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
