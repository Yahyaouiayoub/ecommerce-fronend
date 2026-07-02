"use client"

import Link from "next/link"
import { Receipt, ArrowRight, Download, Eye, FileText } from "lucide-react"
import { Pagination } from "@/components/pagination"
import { SiteShell } from "@/components/site-shell"
import { useApi } from "@/lib/hooks/use-api"
import { getUserInvoices } from "@/lib/api/services"
import { useAuth } from "@/lib/hooks/use-auth"
import { openPdfInNewTab, downloadPdf } from "@/lib/pdf"
import type { Invoice } from "@/lib/types"
import { formatPrice, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  partially_paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 line-through",
}

const statusLabels: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
}

export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, error, loading } = useApi<{
    data: Invoice[]
    current_page: number
    last_page: number
    total: number
  }>(() => getUserInvoices({ page }), [page])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/invoices")
    }
  }, [authLoading, user, router])

  const invoices = data?.data ?? []

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data
                ? `${data.total} invoice${data.total !== 1 ? "s" : ""} total`
                : "View and download your invoices."}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          )}

          {!!error && !loading && (
            <StateMessage
              icon={<Receipt className="size-6" />}
              title="Could not load invoices"
              description="There was a problem fetching your invoices. Please try again later."
            />
          )}

          {!loading && !error && invoices.length === 0 && (
            <StateMessage
              icon={<Receipt className="size-6" />}
              title="No invoices yet"
              description="When you place an order, invoices will show up here."
              action={
                <Button asChild>
                  <Link href="/products">
                    Start shopping
                    <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
              }
            />
          )}

          {!loading &&
            !error &&
            invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="block rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Receipt className="size-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.issued_at
                          ? formatDate(invoice.issued_at)
                          : formatDate(invoice.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-[11px] px-2.5 py-0.5 font-medium border ${
                        statusStyles[invoice.status] ?? ""
                      }`}
                    >
                      {statusLabels[invoice.status] ?? invoice.status_label}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {formatPrice(invoice.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openPdfInNewTab(`/invoices/${invoice.id}/pdf`)
                    }}
                    className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
                    title="View PDF"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      downloadPdf(
                        `/invoices/${invoice.id}/download`,
                        `invoice-${invoice.invoice_number}.pdf`,
                      )
                    }}
                    className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
                    title="Download PDF"
                  >
                    <Download className="size-3.5 text-muted-foreground" />
                  </div>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                    title="View details"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </Link>
            ))}
        </div>

        {data && <Pagination currentPage={page} lastPage={data.last_page} onPageChange={setPage} />}
      </div>
    </SiteShell>
  )
}
