"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import {
  RotateCcw,
  Search,
  RefreshCw,
  ChevronRight,
  Check,
  X,
  Clock,
  ExternalLink,
  Calendar,
  User,
  DollarSign,
} from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { adminGetRefunds, adminApproveRefund, adminRejectRefund, adminCompleteRefund, adminGetRefundStats } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import type { Refund, RefundDashboardStats } from "@/lib/types"
import { toast } from "sonner"

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

const STATUS_FILTERS = ["all", ...Object.keys(statusStyles)] as const

export default function AdminRefundsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const actionRef = useRef<number | null>(null)

  const { data, loading, error, reload } = useApi(
    () => adminGetRefunds({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
      page,
      per_page: 20,
    }),
    [statusFilter, search, page],
  )

  const { data: stats, reload: reloadStats } = useApi<RefundDashboardStats | null>(
    () => adminGetRefundStats(),
    [],
  )

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  const handleAction = useCallback(async (action: string, id: number) => {
    actionRef.current = id
    try {
      if (action === "approve") {
        await adminApproveRefund(id)
        toast.success("Refund approved")
      } else if (action === "reject") {
        await adminRejectRefund(id)
        toast.success("Refund rejected")
      } else if (action === "complete") {
        await adminCompleteRefund(id)
        toast.success("Refund completed")
      }
      reload()
      reloadStats()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"))
    } finally {
      actionRef.current = null
    }
  }, [reload, reloadStats])

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <RotateCcw className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Refund Management</h1>
            <p className="text-sm text-muted-foreground">
              Review and process customer refund requests
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { reload(); reloadStats(); }} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="mt-1 text-2xl font-bold">{stats.total_refunds}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="size-3" /> Pending
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-300">{stats.pending_refunds}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
            <p className="mt-1 text-2xl font-bold">{stats.approved_refunds}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
            <p className="mt-1 text-2xl font-bold">{stats.completed_refunds}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
            <p className="mt-1 text-2xl font-bold">{stats.rejected_refunds}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Refunded</p>
            <p className="mt-1 text-xl font-bold">{formatPrice(stats.total_refunded_amount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search refunds..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <StateMessage
          icon={<RotateCcw className="size-6" />}
          title="Failed to load refunds"
          action={<Button variant="outline" onClick={reload}>Try again</Button>}
        />
      ) : !data?.data?.length ? (
        <StateMessage
          icon={<RotateCcw className="size-6" />}
          title="No refunds found"
          description={search ? "Try a different search term." : "No refund requests yet."}
        />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Refund</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Reason</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((refund) => (
                <tr key={refund.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/refunds/${refund.id}`}
                      className="font-mono text-xs font-medium text-accent hover:underline"
                    >
                      {refund.refund_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {refund.order && (
                      <Link
                        href={`/dashboard/orders/${refund.order.id}`}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        #{refund.order.order_number}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      <span>{refund.requester_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-muted-foreground truncate block">{refund.reason}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(refund.refund_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusStyles[refund.status] ?? ""}>{refund.status_label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(refund.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {refund.status === "pending" && (
                        <>
                          <Button
                            size="xs"
                            variant="default"
                            disabled={actionRef.current === refund.id}
                            onClick={() => handleAction("approve", refund.id)}
                          >
                            <Check className="size-3" />
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={actionRef.current === refund.id}
                            onClick={() => handleAction("reject", refund.id)}
                          >
                            <X className="size-3" />
                            Reject
                          </Button>
                        </>
                      )}
                      {refund.status === "approved" && (
                        <Button
                          size="xs"
                          variant="default"
                          disabled={actionRef.current === refund.id}
                          onClick={() => handleAction("complete", refund.id)}
                        >
                          <Check className="size-3" />
                          Complete
                        </Button>
                      )}
                      <Link href={`/dashboard/refunds/${refund.id}`}>
                        <Button size="xs" variant="ghost">
                          <ExternalLink className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination simple currentPage={page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  )
}
