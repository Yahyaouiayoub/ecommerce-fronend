"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState, useMemo, useRef } from "react"
import {
  AlertCircle,
  Receipt,
  Search,
  X,
  Filter,
  RefreshCw,
  Download,
  Eye,
  FileText,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { usePolling } from "@/lib/hooks/use-polling"
import { adminGetInvoiceStats, adminGetInvoice, getPublicSettings } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectInvoicesPagination } from "@/lib/store"
import { fetchInvoices, updateInvoiceStatus, optimisticStatusUpdate, rollbackInvoice } from "@/lib/store/invoices-slice"
import { downloadInvoicePdf } from "@/lib/generateInvoicePDF"
import { AnimatedCounter } from "@/components/animated-counter"
import type { Invoice, InvoiceStats, PublicSettings } from "@/lib/types"
import { toast } from "sonner"

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["unpaid", "cancelled"],
  unpaid: ["partially_paid", "paid", "failed", "cancelled"],
  partially_paid: ["paid", "failed", "refunded"],
  paid: ["refunded"],
  failed: ["unpaid", "pending"],
  refunded: [],
  cancelled: [],
}

const statusStyles: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  unpaid: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  partially_paid: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  paid: "bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100",
  failed: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  refunded: "bg-neutral-100 text-neutral-500 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
}

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={null}>
      <AdminInvoicesContent />
    </Suspense>
  )
}

function AdminInvoicesContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.invoices.items)
  const loading = useAppSelector((state) => state.invoices.loading)
  const pagination = useAppSelector(selectInvoicesPagination)
  const updatingIds = useAppSelector((state) => state.invoices.updatingIds)

  // Read initial status from URL query params (e.g., from refund alert link)
  const [initialStatus] = useState(() => {
    if (typeof window === "undefined") return ""
    const params = new URLSearchParams(window.location.search)
    return params.get("status") ?? ""
  })

  // Refresh loading state — auto-clears after 5s timeout
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleRefresh() {
    setRefreshing(true)
    reloadStats()
    clearTimeout(refreshTimeoutRef.current)
    refreshTimeoutRef.current = setTimeout(() => setRefreshing(false), 5000)
  }

  useEffect(() => {
    return () => clearTimeout(refreshTimeoutRef.current)
  }, [])

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(!!initialStatus)

  // Stats
  const { data: stats, reload: reloadStats, refresh: refreshStats } = useApi<InvoiceStats | null>(
    () => adminGetInvoiceStats(),
    [],
  )

  usePolling(refreshStats, 30_000)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {}
    if (statusFilter) params.status = statusFilter
    if (paymentMethodFilter) params.payment_method = paymentMethodFilter
    if (search) params.search = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    params.page = page
    params.per_page = 15
    return params
  }, [statusFilter, paymentMethodFilter, search, dateFrom, dateTo, page])

  useEffect(() => {
    dispatch(fetchInvoices(queryParams))
  }, [dispatch, queryParams])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  async function handleStatusUpdate(invoiceId: number, newStatus: string) {
    if (newStatus === "cancelled") {
      const confirmed = window.confirm("Cancel this invoice?")
      if (!confirmed) return
    }
    if (newStatus === "refunded") {
      const confirmed = window.confirm("Mark this invoice as refunded? This action cannot be undone.")
      if (!confirmed) return
    }

    const invoice = items.find((i) => i.id === invoiceId)

    dispatch(optimisticStatusUpdate({ id: invoiceId, status: newStatus }))

    try {
      await dispatch(updateInvoiceStatus({ id: invoiceId, status: newStatus })).unwrap()
      reloadStats()
      toast.success(`Invoice marked as ${statusLabels[newStatus] ?? newStatus}`)
    } catch (err) {
      if (invoice) {
        dispatch(rollbackInvoice({ id: invoiceId, previous: invoice }))
      }
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    }
  }

  const clearFilters = () => {
    setStatusFilter("")
    setPaymentMethodFilter("")
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const hasActiveFilters = statusFilter || paymentMethodFilter || search || dateFrom || dateTo

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {stats
              ? `${stats.total_invoices} total · ${formatPrice(stats.total_revenue)} collected`
              : "Manage customer invoices"}
            {hasActiveFilters && " — filtered"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={refreshing} onClick={handleRefresh}>
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="size-3.5" />
            Filters
            {hasActiveFilters && <span className="ml-0.5 size-1.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />}
          </Button>
        </div>
      </div>

      {/* Stats Cards — monochrome */}
      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            icon={<FileText className="size-4" />}
            label="Total"
            value={<AnimatedCounter value={stats.total_invoices} />}
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            label="Paid"
            value={<AnimatedCounter value={stats.paid_invoices} />}
          />
          <StatCard
            icon={<AlertTriangle className="size-4" />}
            label="Pending"
            value={<AnimatedCounter value={stats.pending_invoices} />}
          />
          <StatCard
            icon={<RotateCcw className="size-4" />}
            label="Refunded"
            value={<AnimatedCounter value={stats.refunded_invoices} />}
          />
          <StatCard
            icon={<X className="size-4" />}
            label="Failed"
            value={<AnimatedCounter value={stats.failed_invoices} />}
          />
          <StatCard
            icon={<X className="size-4" />}
            label="Cancelled"
            value={<AnimatedCounter value={stats.cancelled_invoices} />}
          />
          <StatCard
            icon={<DollarSign className="size-4" />}
            label="Revenue"
            value={<AnimatedCounter value={stats.total_revenue} formatCurrency />}
          />
        </div>
      )}

      {/* Filter bar */}
      {showFilters && (
        <div className="mt-4 border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-32 flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="min-w-32 flex-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Payment
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
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Invoice#, order#, customer..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                From
              </label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-36" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-sm" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <StateMessage
          icon={<Receipt className="size-6" />}
          title={hasActiveFilters ? "No invoices match your filters" : "No invoices yet"}
          description={hasActiveFilters ? "Try adjusting your filters." : "Invoices are automatically created when orders are placed."}
          action={hasActiveFilters ? <Button onClick={clearFilters} variant="outline">Clear filters</Button> : undefined}
        />
      ) : (
        <>
          {/* Invoices Table — monochrome minimalist */}
          <div className="mt-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/30">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-neutral-900 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-400 transition-colors"
                      >
                        {invoice.invoice_number}
                      </Link>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {invoice.order?.order_number ?? `#${invoice.order_id}`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-neutral-700 dark:text-neutral-300">
                      {invoice.billing_name ?? invoice.order?.customer?.full_name ?? "N/A"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {invoice.order?.status_label ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium border ${statusStyles[invoice.status] ?? ""}`}>
                        {statusLabels[invoice.status] ?? invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-neutral-900 dark:text-neutral-100">
                      {formatPrice(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-neutral-700 dark:text-neutral-300">
                      {invoice.paid_amount > 0 ? formatPrice(invoice.paid_amount) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {invoice.remaining_amount > 0 ? (
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatPrice(invoice.remaining_amount)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {invoice.created_at
                        ? new Date(invoice.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })
                        : ""}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="inline-flex size-7 items-center justify-center rounded-sm text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                          title="View details"
                        >
                          <Eye className="size-3.5" />
                        </Link>
                        <button
                          onClick={async () => {
                            try {
                              const [detailRes, settings] = await Promise.all([
                                adminGetInvoice(invoice.id),
                                getPublicSettings(),
                              ])
                              const logoUrl = settings?.logo_url ? getImageUrl(settings.logo_url) : undefined
                              const companySettings = settings ? {
                                company_name: settings.company_name ?? 'Lumen Store',
                                company_address: settings.company_address ?? '123 Commerce Street',
                                company_city: settings.company_city ?? 'Casablanca',
                                company_country: settings.company_country ?? 'Morocco',
                                company_phone: settings.company_phone ?? '',
                                company_email: settings.company_email ?? '',
                              } : undefined
                              await downloadInvoicePdf(detailRes.data, detailRes.meta, companySettings, logoUrl)
                              toast.success("Invoice PDF downloaded")
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Failed to download PDF")
                            }
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-sm text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="size-3.5" />
                        </button>

                        {/* Status transition dropdown */}
                        <div className="relative group">
                          <button
                            className="inline-flex size-7 items-center justify-center rounded-sm text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
                            disabled={updatingIds.includes(invoice.id)}
                          >
                            {updatingIds.includes(invoice.id) ? (
                              <RefreshCw className="size-3 animate-spin" />
                            ) : (
                              <span className="tracking-wider">···</span>
                            )}
                          </button>
                          <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-36 border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 group-hover:block">
                            {STATUS_TRANSITIONS[invoice.status]?.length > 0 ? (
                              STATUS_TRANSITIONS[invoice.status].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusUpdate(invoice.id, s)}
                                  className="flex w-full items-center rounded-sm px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                                >
                                  Mark {statusLabels[s] ?? s}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-1.5 text-xs text-neutral-400">Terminal</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination simple currentPage={page} lastPage={pagination.lastPage} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

// =========================
// Monochrome Stat Card
// =========================
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {label}
        </p>
      </div>
      <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  )
}
