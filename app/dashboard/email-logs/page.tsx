"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { api, getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

interface EmailLogEntry {
  id: number
  recipient_email: string
  subject: string
  mailable_type: string | null
  mailer_driver: string | null
  status: "sent" | "failed"
  error_message: string | null
  created_at: string
}

interface EmailLogStats {
  total_sent: number
  total_failed: number
  today_sent: number
  by_mailable: { mailable_type: string; count: number }[]
}

interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const MAILABLE_LABELS: Record<string, string> = {
  "App\\Mail\\OrderConfirmationMail": "Order Confirmation",
  "App\\Mail\\InvoiceMail": "Invoice",
  "App\\Mail\\AbandonedCartMail": "Abandoned Cart",
  "App\\Mail\\RefundStatusMail": "Refund Status",
}

function mailableLabel(type: string | null): string {
  if (!type) return "Test / Raw"
  return MAILABLE_LABELS[type] ?? type.split("\\").pop() ?? type
}

export default function EmailLogsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<PaginatedResponse<EmailLogEntry> | null>(null)
  const [stats, setStats] = useState<EmailLogStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState("")
  const [recipientFilter, setRecipientFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  const fetchLogs = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page }
      if (statusFilter) params.status = statusFilter
      if (recipientFilter) params.recipient = recipientFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const [logsRes, statsRes] = await Promise.all([
        api.get<PaginatedResponse<EmailLogEntry>>("/admin/email-logs", { params }),
        api.get<EmailLogStats>("/admin/email-logs/stats"),
      ])
      setLogs(logsRes.data)
      setStats(statsRes.data)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load email logs"))
      toast.error("Failed to load email logs")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, recipientFilter, dateFrom, dateTo])

  useEffect(() => {
    if (authLoading) return
    fetchLogs()
  }, [authLoading, fetchLogs])

  function handleRefresh() {
    setLoading(true)
    fetchLogs()
  }

  if (authLoading) return null

  if (loading && !logs) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-2 h-5 w-64" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Mail className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Email Logs</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Track all outgoing email deliveries
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{stats.total_sent}</p>
            <p className="text-xs text-muted-foreground">
              {stats.today_sent} sent today
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Failed</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{stats.total_failed}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">By Type</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {stats.by_mailable.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                stats.by_mailable.slice(0, 3).map((item) => (
                  <div key={item.mailable_type} className="flex items-center justify-between text-sm">
                    <span className="truncate text-muted-foreground">{mailableLabel(item.mailable_type)}</span>
                    <span className="ml-2 font-medium">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-[160px] flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            <Search className="inline size-3 mr-1" />
            Recipient
          </label>
          <Input
            value={recipientFilter}
            onChange={(e) => { setRecipientFilter(e.target.value); setPage(1) }}
            placeholder="Filter by email..."
            className="h-9 text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            <Calendar className="inline size-3 mr-1" />
            From
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="h-9 text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            <Calendar className="inline size-3 mr-1" />
            To
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="mt-6 flex flex-col items-center justify-center py-16 text-center">
          <Mail className="size-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Could not load email logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Driver</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No email logs match your filters.
                    </td>
                  </tr>
                ) : (
                  logs?.data.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{log.recipient_email}</td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-muted-foreground" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{mailableLabel(log.mailable_type)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.mailer_driver ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span className="text-xs font-medium">Sent</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400" title={log.error_message ?? ""}>
                            <XCircle className="size-3.5" />
                            <span className="text-xs font-medium">Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs && logs.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {logs.current_page} of {logs.last_page} ({logs.total} entries)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logs.current_page >= logs.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
