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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  User,
  MapPin,
  Building2,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { adminGetInvoice, adminUpdateInvoiceStatus, adminRecordPayment, adminSendInvoice } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { openPdfInNewTab, downloadPdf } from "@/lib/pdf"
import type { Invoice, InvoiceDetailResponse } from "@/lib/types"
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
  pending: "bg-neutral-100 text-neutral-800 border-neutral-300",
  unpaid: "bg-neutral-100 text-neutral-800 border-neutral-300",
  partially_paid: "bg-neutral-100 text-neutral-800 border-neutral-300",
  paid: "bg-neutral-800 text-white border-neutral-800",
  failed: "bg-neutral-100 text-neutral-800 border-neutral-300",
  refunded: "bg-neutral-100 text-neutral-800 border-neutral-300 line-through",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200 line-through",
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

export default function AdminInvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const { data, loading, error, reload } = useApi<InvoiceDetailResponse | null>(
    () => adminGetInvoice(id),
    [id],
  )

  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)

  // Payment recording state
  const [paymentType, setPaymentType] = useState("full")
  const [customAmount, setCustomAmount] = useState("")
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  const invoice = data?.data
  const meta = data?.meta

  const remaining = invoice?.remaining_amount ?? 0

  const items = invoice?.order?.items ?? []
  const visibleItems = showAllItems ? items : items.slice(0, ITEMS_PER_PAGE)
  const hasMoreItems = items.length > ITEMS_PER_PAGE

  const PAYMENT_PRESETS = [
    { value: "full", label: "Full (100%)", multiplier: 1.0 },
    { value: "partial_20", label: "20%", multiplier: 0.2 },
    { value: "partial_30", label: "30%", multiplier: 0.3 },
    { value: "partial_50", label: "50%", multiplier: 0.5 },
    { value: "partial_60", label: "60%", multiplier: 0.6 },
    { value: "partial_70", label: "70%", multiplier: 0.7 },
    { value: "partial_80", label: "80%", multiplier: 0.8 },
    { value: "custom", label: "Custom", multiplier: null },
  ]

  const calculatedAmount =
    paymentType === "custom"
      ? Number.parseFloat(customAmount) || 0
      : Math.round(remaining * (PAYMENT_PRESETS.find((p) => p.value === paymentType)?.multiplier ?? 1) * 100) / 100

  async function handleStatusUpdate(newStatus: string) {
    if (!invoice) return

    if (newStatus === "cancelled") {
      if (!window.confirm("Cancel this invoice?")) return
    }
    if (newStatus === "refunded") {
      if (!window.confirm("Mark this invoice as refunded? This action cannot be undone.")) return
    }

    setUpdatingStatus(true)
    try {
      await adminUpdateInvoiceStatus(invoice.id, newStatus)
      toast.success(`Invoice marked as ${statusLabels[newStatus] ?? newStatus}`)
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleRecordPayment() {
    if (!invoice || invoice.status === "paid") return

    if (paymentType === "custom" && (!customAmount || Number.parseFloat(customAmount) <= 0)) {
      toast.error("Please enter a valid amount")
      return
    }

    if (calculatedAmount > remaining) {
      toast.error(`Amount exceeds remaining balance (${formatPrice(remaining)})`)
      return
    }

    setRecordingPayment(true)
    try {
      await adminRecordPayment(
        invoice.id,
        paymentType,
        paymentType === "custom" ? Number.parseFloat(customAmount) : undefined,
      )
      toast.success(`Payment of ${formatPrice(calculatedAmount)} recorded`)
      setPaymentType("full")
      setCustomAmount("")
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to record payment"))
    } finally {
      setRecordingPayment(false)
    }
  }

  async function handleSendEmail() {
    if (!invoice) return

    const recipient = invoice.billing_email ?? invoice.order?.customer?.email
    if (!recipient) {
      toast.error("No billing email found for this invoice.")
      return
    }

    const confirmed = window.confirm(
      `Send invoice ${invoice.invoice_number} to ${recipient}?`,
    )
    if (!confirmed) return

    setSendingEmail(true)
    try {
      const res = await adminSendInvoice(invoice.id)
      toast.success(res.message)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invoice"))
    } finally {
      setSendingEmail(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
      {/* ================================
          ADMIN TOOLBAR (hidden when printing)
      ================================ */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to invoices
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openPdfInNewTab(`/admin/invoices/${id}/pdf`)}>
            <Eye className="size-4" />
            Preview PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadPdf(`/admin/invoices/${id}/download`, `invoice-${invoice?.invoice_number ?? id}.pdf`)}>
            <Download className="size-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
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
          action={<Button onClick={reload} variant="outline">Try again</Button>}
        />
      ) : !invoice ? (
        <StateMessage
          icon={<Receipt className="size-6" />}
          title="Invoice not found"
          action={<Link href="/dashboard/invoices"><Button variant="outline">View all invoices</Button></Link>}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] print:grid-cols-1">
          {/* ================================
              INVOICE DOCUMENT (main content)
          ================================ */}
          <div className="bg-white text-neutral-900 border border-neutral-200 shadow-sm print:border-none print:shadow-none">
            {/* --- Header --- */}
            <div className="px-10 pt-10 pb-8 border-b border-neutral-200 print:px-8 print:pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 className="size-6 text-neutral-400" />
                    <span className="text-lg font-semibold tracking-tight text-neutral-800">
                      {invoice.billing_name ?? "Lumen Store"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-1.5">
                    123 Commerce Street, Casablanca, Morocco
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-light tracking-[0.15em] text-neutral-900 uppercase">
                    Invoice
                  </h1>
                  <p className="mt-1 text-sm font-mono text-neutral-600">
                    {invoice.invoice_number}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Metadata --- */}
            <div className="px-10 py-6 border-b border-neutral-100 print:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">Invoice #</p>
                  <p className="font-mono text-neutral-800">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">Order #</p>
                  {invoice.order ? (
                    <Link
                      href={`/dashboard/orders/${invoice.order.id}`}
                      className="font-mono text-neutral-800 hover:underline inline-flex items-center gap-1"
                    >
                      {invoice.order.order_number}
                      <ExternalLink className="size-3 text-neutral-300" />
                    </Link>
                  ) : (
                    <p className="font-mono text-neutral-400">#{invoice.order_id}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">Date</p>
                  <p className="text-neutral-800">
                    {invoice.issued_at
                      ? new Date(invoice.issued_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric"
                        })
                      : new Date(invoice.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-1">Status</p>
                  <p className={`inline-block px-2.5 py-0.5 text-xs font-medium border ${statusStyles[invoice.status] ?? ""}`}>
                    {statusLabels[invoice.status] ?? invoice.status}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Bill To + Amount Summary side by side --- */}
            <div className="px-10 py-6 border-b border-neutral-100 print:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Bill To */}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">Bill To</p>
                  <div className="space-y-1 text-sm text-neutral-700">
                    <p className="font-medium text-neutral-900">{invoice.billing_name ?? invoice.order?.customer?.full_name ?? "N/A"}</p>
                    {invoice.billing_email && <p className="text-neutral-500">{invoice.billing_email}</p>}
                    {invoice.billing_phone && <p className="text-neutral-500">{invoice.billing_phone}</p>}
                    {invoice.billing_address && (
                      <p className="text-neutral-500 whitespace-pre-wrap mt-1">{invoice.billing_address}</p>
                    )}
                    {invoice.order?.address && !invoice.billing_address && (
                      <div className="text-neutral-500 mt-1">
                        <p>{invoice.order.address.full_name}</p>
                        <p>{invoice.order.address.address_line1}</p>
                        {invoice.order.address.address_line2 && <p>{invoice.order.address.address_line2}</p>}
                        <p>
                          {invoice.order.address.city}
                          {invoice.order.address.state ? `, ${invoice.order.address.state}` : ""}
                          {" "}{invoice.order.address.postal_code}
                        </p>
                        <p>{invoice.order.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="sm:text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">Amount Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between sm:justify-end gap-4 text-sm">
                      <span className="text-neutral-500 sm:hidden">Total</span>
                      <span className="text-xl font-semibold text-neutral-900">{formatPrice(invoice.total_amount)}</span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex justify-between sm:justify-end gap-4 text-xs text-neutral-400">
                        <span className="sm:hidden">Due date</span>
                        <span>Due {new Date(invoice.due_date).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric"
                        })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Products Table --- */}
            {items.length > 0 && (
              <div className="px-10 py-6 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-4">Products</p>

                {/* Table header */}
                <div className="hidden sm:grid sm:grid-cols-[2fr_80px_120px_120px] gap-3 py-2.5 border-b border-neutral-200 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  <span>Product</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Unit Price</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-neutral-100">
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 sm:grid-cols-[2fr_80px_120px_120px] gap-2 sm:gap-3 py-3.5 text-sm"
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <p className="font-medium text-neutral-900">{item.product_name}</p>
                        <p className="text-xs text-neutral-400 sm:hidden mt-0.5">
                          Qty: {item.quantity} × {item.price_formatted}
                        </p>
                      </div>
                      <span className="hidden sm:block text-center text-neutral-600">{item.quantity}</span>
                      <span className="hidden sm:block text-right text-neutral-600">{item.price_formatted}</span>
                      <span className="text-right font-medium text-neutral-900 sm:text-right row-start-2 sm:row-start-auto col-start-2 sm:col-start-auto">
                        {item.subtotal_formatted}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Show more / Show less toggle */}
                {hasMoreItems && (
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
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
            <div className="px-10 py-6 border-t border-neutral-200 print:px-8">
              <div className="ml-auto max-w-xs space-y-2">
                {meta && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="text-neutral-800">{formatPrice(meta.subtotal)}</span>
                    </div>
                    {meta.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Shipping</span>
                        <span className="text-neutral-800">{formatPrice(meta.shipping)}</span>
                      </div>
                    )}
                    {meta.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Tax</span>
                        <span className="text-neutral-800">{formatPrice(meta.tax)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                  </>
                )}
                <div className="flex justify-between text-base font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatPrice(invoice.total_amount)}</span>
                </div>
                {invoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Paid</span>
                      <span className="text-neutral-700">− {formatPrice(invoice.paid_amount)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-neutral-700">Balance Due</span>
                      <span className={invoice.remaining_amount > 0 ? "text-neutral-900" : "text-neutral-400"}>
                        {formatPrice(invoice.remaining_amount)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* --- Payment History --- */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="px-10 py-6 border-t border-neutral-100 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-4">
                  Payment History
                </p>
                <div className="space-y-3">
                  {[...invoice.payments]
                    .sort((a, b) => new Date(b.paid_at ?? b.created_at).getTime() - new Date(a.paid_at ?? a.created_at).getTime())
                    .map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="size-1.5 rounded-full bg-neutral-300" />
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{payment.payment_type_label}</p>
                            <p className="text-xs text-neutral-400">
                              {payment.paid_at
                                ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                                    year: "numeric", month: "short", day: "numeric"
                                  })
                                : new Date(payment.created_at).toLocaleDateString("en-US", {
                                    year: "numeric", month: "short", day: "numeric"
                                  })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-neutral-800">{payment.amount_formatted}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* --- Notes --- */}
            {invoice.notes && (
              <div className="px-10 py-6 border-t border-neutral-100 print:px-8">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-2">Notes</p>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* --- Footer --- */}
            <div className="px-10 py-6 border-t border-neutral-200 text-center print:px-8">
              <p className="text-xs text-neutral-400">
                Thank you for your business
              </p>
              <p className="text-[10px] text-neutral-300 mt-1">
                Generated on {new Date(invoice.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </p>
            </div>
          </div>

          {/* ================================
              SIDEBAR — Admin Controls (hidden when printing)
          ================================ */}
          <div className="space-y-6 print:hidden">
            {/* Status Management */}
            <div className="rounded-sm border border-neutral-200 bg-white p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Status
              </h2>
              <div className="space-y-2">
                {STATUS_TRANSITIONS[invoice.status]?.length > 0 ? (
                  STATUS_TRANSITIONS[invoice.status].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      className="w-full justify-start text-xs"
                      variant="outline"
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(s)}
                    >
                      {updatingStatus ? "..." : `Mark as ${statusLabels[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}`}
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400">Terminal state.</p>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-sm border border-neutral-200 bg-white p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Customer
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <User className="size-3.5 mt-0.5 text-neutral-400 shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-800">{invoice.billing_name ?? invoice.order?.customer?.full_name ?? "N/A"}</p>
                    {invoice.billing_email && <p className="text-xs text-neutral-400">{invoice.billing_email}</p>}
                    {invoice.billing_phone && <p className="text-xs text-neutral-400">{invoice.billing_phone}</p>}
                  </div>
                </div>
                {invoice.billing_address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-3.5 mt-0.5 text-neutral-400 shrink-0" />
                    <p className="text-xs text-neutral-500 whitespace-pre-wrap">{invoice.billing_address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-sm border border-neutral-200 bg-white p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Order
              </h2>
              {invoice.order ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Order #</span>
                    <Link
                      href={`/dashboard/orders/${invoice.order.id}`}
                      className="text-xs font-mono text-neutral-700 hover:underline flex items-center gap-1"
                    >
                      {invoice.order.order_number}
                      <ExternalLink className="size-3 text-neutral-300" />
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Status</span>
                    <span className="text-xs font-medium text-neutral-700">{invoice.order.status_label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Total</span>
                    <span className="text-xs font-medium text-neutral-800">{formatPrice(invoice.order.total_price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Date</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(invoice.order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">Order #{invoice.order_id}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-sm border border-neutral-200 bg-white p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Payment
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  {invoice.payment_method === "card" ? (
                    <CreditCard className="size-3.5 text-neutral-400" />
                  ) : (
                    <Banknote className="size-3.5 text-neutral-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {invoice.payment_method === "card" ? "Card Payment" : invoice.payment_method === "cod" ? "Cash on Delivery" : "N/A"}
                    </p>
                    {invoice.paid_at && (
                      <p className="text-xs text-neutral-400">
                        Paid {new Date(invoice.paid_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {invoice.due_date && (
                  <p className="text-xs text-neutral-400">
                    Due {new Date(invoice.due_date).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Record Payment */}
            {invoice.status !== "paid" && invoice.status !== "refunded" && invoice.status !== "cancelled" && (
              <div className="rounded-sm border border-neutral-200 bg-white p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                  Record Payment
                </h2>

                <p className="mb-4 text-sm text-neutral-700">
                  Remaining:{" "}
                  <span className="font-semibold text-neutral-900">
                    {formatPrice(remaining)}
                  </span>
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Amount</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PAYMENT_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setPaymentType(preset.value)
                            setCustomAmount("")
                          }}
                          className={`rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            paymentType === preset.value
                              ? "bg-neutral-800 text-white"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setPaymentType("custom")}
                        className={`rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          paymentType === "custom"
                            ? "bg-neutral-800 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {paymentType === "custom" && (
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                        Amount (max {formatPrice(remaining)})
                      </label>
                      <Input
                        type="number"
                        min="0.01"
                        max={remaining}
                        step="0.01"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="rounded-sm border-neutral-200 text-sm"
                      />
                    </div>
                  )}

                  {calculatedAmount > 0 && calculatedAmount !== remaining && (
                    <div className="rounded-sm bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                      Recording{" "}
                      <span className="font-semibold text-neutral-700">{formatPrice(calculatedAmount)}</span>
                      {" · "}After:{" "}
                      <span className="font-semibold text-neutral-700">{formatPrice(remaining - calculatedAmount)}</span>
                    </div>
                  )}

                  <Button
                    className="w-full rounded-sm"
                    size="sm"
                    disabled={recordingPayment || calculatedAmount <= 0 || calculatedAmount > remaining}
                    onClick={handleRecordPayment}
                  >
                    {recordingPayment
                      ? "Recording..."
                      : `Record ${formatPrice(calculatedAmount)}`}
                  </Button>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="rounded-sm border border-neutral-200 bg-white p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Documents
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => openPdfInNewTab(`/admin/invoices/${invoice.id}/pdf`)}
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <Eye className="size-3.5 text-neutral-400" />
                  <span>Preview Invoice</span>
                </button>
                <button
                  onClick={() => downloadPdf(`/admin/invoices/${invoice.id}/download`, `invoice-${invoice.invoice_number}.pdf`)}
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <Download className="size-3.5 text-neutral-400" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <Printer className="size-3.5 text-neutral-400" />
                  <span>Print</span>
                </button>
                <div className="border-t border-neutral-100 my-2" />
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  <Send className="size-3.5 text-neutral-400" />
                  <span>{sendingEmail ? "Sending..." : "Send to customer"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
