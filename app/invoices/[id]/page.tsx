"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertCircle,
  Receipt,
  ArrowLeft,
  Download,
  Eye,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { getUserInvoice, getPublicSettings } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getImageUrl } from "@/lib/api/client"
import { previewInvoicePdf, downloadInvoicePdf } from "@/lib/generateInvoicePDF"
import { SiteShell } from "@/components/site-shell"
import { toast } from "sonner"
import type { Invoice, PublicSettings } from "@/lib/types"

const statusStyles: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  unpaid: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  partially_paid: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  paid: "bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100",
  failed: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  refunded: "bg-neutral-100 text-neutral-800 border-neutral-300 line-through dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
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

const ITEMS_PER_PAGE = 3

export default function CustomerInvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const { data: invoice, loading, error, reload } = useApi<Invoice | null>(
    () => getUserInvoice(id),
    [id],
  )
  const { data: settingsData } = useApi<PublicSettings | null>(
    () => getPublicSettings(),
    [],
  )
  const logoUrl = settingsData?.logo_url ? getImageUrl(settingsData.logo_url) : undefined
  const companySettings = settingsData ? {
    company_name: settingsData.company_name ?? 'Lumen Store',
    company_address: settingsData.company_address ?? '123 Commerce Street',
    company_city: settingsData.company_city ?? 'Casablanca',
    company_country: settingsData.company_country ?? 'Morocco',
    company_phone: settingsData.company_phone ?? '',
    company_email: settingsData.company_email ?? '',
  } : undefined

  const [showAllItems, setShowAllItems] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/invoices/${id}`)
    }
  }, [authLoading, user, id, router])

  if (authLoading) return null

  const items = invoice?.order?.items ?? []
  const visibleItems = showAllItems ? items : items.slice(0, ITEMS_PER_PAGE)
  const hasMoreItems = items.length > ITEMS_PER_PAGE

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
        {/* Customer Toolbar (hidden when printing) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to orders
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {invoice && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!invoice) return
                    try {
                      await previewInvoicePdf(invoice, undefined, companySettings, logoUrl)
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to preview PDF")
                    }
                  }}
                >
                  <Eye className="size-4" />
                  Preview PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!invoice) return
                    try {
                      await downloadInvoicePdf(invoice, undefined, companySettings, logoUrl)
                      toast.success("PDF downloaded")
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to download PDF")
                    }
                  }}
                >
                  <Download className="size-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Print
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-[800px] w-full rounded-sm border" />
          </div>
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load invoice"
            action={
              <Button onClick={reload} variant="outline">
                Try again
              </Button>
            }
          />
        ) : !invoice ? (
          <StateMessage
            icon={<Receipt className="size-6" />}
            title="Invoice not found"
            action={
              <Link href="/orders">
                <Button variant="outline">View my orders</Button>
              </Link>
            }
          />
        ) : (
          <div className="bg-white text-neutral-900 border border-neutral-200 shadow-sm dark:bg-neutral-950 dark:text-neutral-100 dark:border-neutral-800 print:border-none print:shadow-none">
            {/* --- Header --- */}
            <div className="px-10 pt-10 pb-8 border-b border-neutral-200 dark:border-neutral-800 print:px-8 print:pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 className="size-6 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
                      {invoice.billing_name ?? "Lumen Store"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mt-1.5">
                    123 Commerce Street, Casablanca, Morocco
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-light tracking-[0.15em] text-neutral-900 dark:text-neutral-100 uppercase">
                    Invoice
                  </h1>
                  <p className="mt-1 text-sm font-mono text-neutral-600 dark:text-neutral-400">
                    {invoice.invoice_number}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Metadata --- */}
            <div className="px-10 py-6 border-b border-neutral-100 dark:border-neutral-800 print:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Invoice #
                  </p>
                  <p className="font-mono text-neutral-800 dark:text-neutral-200">
                    {invoice.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Order #
                  </p>
                  <p className="font-mono text-neutral-800 dark:text-neutral-200">
                    {invoice.order?.order_number ?? `#${invoice.order_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Date
                  </p>
                  <p className="text-neutral-800 dark:text-neutral-200">
                    {invoice.issued_at
                      ? new Date(invoice.issued_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : new Date(invoice.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Status
                  </p>
                  <p
                    className={`inline-block px-2.5 py-0.5 text-xs font-medium border ${statusStyles[invoice.status] ?? ""}`}
                  >
                    {statusLabels[invoice.status] ?? invoice.status}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Bill To + Amount Summary side by side --- */}
            <div className="px-10 py-6 border-b border-neutral-100 dark:border-neutral-800 print:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Bill To */}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                    Bill To
                  </p>
                  <div className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {invoice.billing_name ??
                        invoice.order?.customer?.full_name ??
                        "N/A"}
                    </p>
                    {invoice.billing_email && (
                      <p className="text-neutral-500 dark:text-neutral-400">
                        {invoice.billing_email}
                      </p>
                    )}
                    {invoice.billing_phone && (
                      <p className="text-neutral-500 dark:text-neutral-400">
                        {invoice.billing_phone}
                      </p>
                    )}
                    {invoice.billing_address && (
                      <p className="text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap mt-1">
                        {invoice.billing_address}
                      </p>
                    )}
                    {invoice.order?.address && !invoice.billing_address && (
                      <div className="text-neutral-500 dark:text-neutral-400 mt-1">
                        <p>{invoice.order.address.full_name}</p>
                        <p>{invoice.order.address.address_line1}</p>
                        {invoice.order.address.address_line2 && (
                          <p>{invoice.order.address.address_line2}</p>
                        )}
                        <p>
                          {invoice.order.address.city}
                          {invoice.order.address.state
                            ? `, ${invoice.order.address.state}`
                            : ""}
                          {" "}
                          {invoice.order.address.postal_code}
                        </p>
                        <p>{invoice.order.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="sm:text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                    Amount Summary
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between sm:justify-end gap-4 text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:hidden">
                        Total
                      </span>
                      <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatPrice(invoice.total_amount)}
                      </span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex justify-between sm:justify-end gap-4 text-xs text-neutral-400 dark:text-neutral-500">
                        <span className="sm:hidden">Due date</span>
                        <span>
                          Due{" "}
                          {new Date(invoice.due_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {invoice.payments && invoice.payments.length > 0 && invoice.paid_at && (
                      <div className="flex justify-between sm:justify-end gap-4 text-xs text-neutral-400 dark:text-neutral-500">
                        <span className="sm:hidden">Paid</span>
                        <span>
                          Paid{" "}
                          {new Date(invoice.paid_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Products Table --- */}
            {items.length > 0 && (
              <div className="px-10 py-6 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                  Products
                </p>

                {/* Table header */}
                <div className="hidden sm:grid sm:grid-cols-[2fr_80px_120px_120px] gap-3 py-2.5 border-b border-neutral-200 dark:border-neutral-700 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span>Product</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Unit Price</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 sm:grid-cols-[2fr_80px_120px_120px] gap-2 sm:gap-3 py-3.5 text-sm"
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 sm:hidden mt-0.5">
                          Qty: {item.quantity} × {item.price_formatted}
                        </p>
                      </div>
                      <span className="hidden sm:block text-center text-neutral-600 dark:text-neutral-400">
                        {item.quantity}
                      </span>
                      <span className="hidden sm:block text-right text-neutral-600 dark:text-neutral-400">
                        {item.price_formatted}
                      </span>
                      <span className="text-right font-medium text-neutral-900 dark:text-neutral-100 sm:text-right row-start-2 sm:row-start-auto col-start-2 sm:col-start-auto">
                        {item.subtotal_formatted}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Show more / Show less toggle */}
                {hasMoreItems && (
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showAllItems ? (
                      <>
                        <ChevronUp className="size-3.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3.5" />
                        Show all {items.length} items
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* --- Totals --- */}
            <div className="px-10 py-6 border-t border-neutral-200 dark:border-neutral-800 print:px-8">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  <span>Total</span>
                  <span>{formatPrice(invoice.total_amount)}</span>
                </div>
                {invoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                      <span>Paid</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        − {formatPrice(invoice.paid_amount)}
                      </span>
                    </div>
                    <Separator className="my-1 dark:bg-neutral-800" />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        Balance Due
                      </span>
                      <span
                        className={
                          invoice.remaining_amount > 0
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-400 dark:text-neutral-500"
                        }
                      >
                        {formatPrice(invoice.remaining_amount)}
                      </span>
                    </div>
                  </>
                )}
                {invoice.payment_method && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                    {invoice.payment_method === "card" ? (
                      <CreditCard className="size-3.5" />
                    ) : (
                      <Banknote className="size-3.5" />
                    )}
                    <span>
                      {invoice.payment_method === "card"
                        ? "Card Payment"
                        : invoice.payment_method === "cod"
                          ? "Cash on Delivery"
                          : invoice.payment_method}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* --- Payment History --- */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="px-10 py-6 border-t border-neutral-100 dark:border-neutral-800 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                  Payment History
                </p>
                <div className="space-y-3">
                  {[...invoice.payments]
                    .sort(
                      (a, b) =>
                        new Date(b.paid_at ?? b.created_at).getTime() -
                        new Date(a.paid_at ?? a.created_at).getTime(),
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                          <div>
                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                              {payment.payment_type_label}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                              {payment.paid_at
                                ? new Date(payment.paid_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )
                                : new Date(payment.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                          {payment.amount_formatted}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* --- Notes --- */}
            {invoice.notes && (
              <div className="px-10 py-6 border-t border-neutral-100 dark:border-neutral-800 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  Notes
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* --- Footer --- */}
            <div className="px-10 py-6 border-t border-neutral-200 dark:border-neutral-800 text-center print:px-8">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Thank you for your business
              </p>
              <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">
                Generated on{" "}
                {new Date(invoice.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  )
}
