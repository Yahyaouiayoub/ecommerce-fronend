"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useRef } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Phone,
  Printer,
  ShoppingCart,
  User,
  Mail,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  adminGetOrderDetail,
  adminGetOrderPaymentSummary,
  adminGetInvoicePaymentOptions,
  adminRecordPayment,
} from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectOrdersUpdating } from "@/lib/store"
import { updateOrderStatus, optimisticStatusUpdate, rollbackOrder } from "@/lib/store/orders-slice"
import type { Order, Invoice, InvoicePayment, OrderPaymentSummary, InvoicePaymentOptions } from "@/lib/types"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

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

const invoiceStatusStyles: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  partially_paid: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  // Fetch order details
  const { data: order, loading, error, reload: reloadOrders } = useApi<Order | null>(
    () => adminGetOrderDetail(orderId),
    [orderId],
  )

  // Fetch payment summary
  const { data: paymentSummary, loading: paymentLoading, reload: reloadPaymentSummary } = useApi<OrderPaymentSummary>(
    () => adminGetOrderPaymentSummary(orderId),
    [orderId],
  )

  const dispatch = useAppDispatch()
  const reduxUpdatingIds = useAppSelector(selectOrdersUpdating)
  const previousOrderRef = useRef<Order | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentOptions, setPaymentOptions] = useState<InvoicePaymentOptions | null>(null)
  const [paymentType, setPaymentType] = useState("full")
  const [customAmount, setCustomAmount] = useState("")
  const [recordingPayment, setRecordingPayment] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  // Load payment options when an invoice is selected
  const loadPaymentOptions = useCallback(async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentType("full")
    setCustomAmount("")
    try {
      const opts = await adminGetInvoicePaymentOptions(invoice.id)
      setPaymentOptions(opts)
      setShowPaymentForm(true)
    } catch {
      toast.error("Failed to load payment options")
    }
  }, [])

  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (newStatus === "cancelled") {
      const confirmed = window.confirm("Cancel this order? This will restore product stock.")
      if (!confirmed) return
    }
    // Save previous state for rollback
    if (order) previousOrderRef.current = { ...order }
    
    // Optimistic update - update UI immediately
    setOptimisticStatus(newStatus)
    dispatch(optimisticStatusUpdate({ id: orderId, status: newStatus }))
    
    try {
      // Send API request in background
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap()
      toast.success(`Order marked as ${newStatus}`)
    } catch (err) {
      // Rollback on error
      setOptimisticStatus(null)
      if (previousOrderRef.current) {
        dispatch(rollbackOrder({ id: orderId, previous: previousOrderRef.current }))
      }
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    }
  }, [orderId, order, dispatch])

  const handleRecordPayment = useCallback(async () => {
    if (!selectedInvoice) return
    setRecordingPayment(true)
    try {
      const amount = paymentType === "custom" ? parseFloat(customAmount) : undefined
      await adminRecordPayment(selectedInvoice.id, paymentType, amount)
      toast.success("Payment recorded successfully")
      setShowPaymentForm(false)
      setSelectedInvoice(null)
      reloadPaymentSummary()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to record payment"))
    } finally {
      setRecordingPayment(false)
    }
  }, [selectedInvoice, paymentType, customAmount, reloadPaymentSummary])

  const handlePrintInvoice = useCallback((invoice: Invoice) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const customer = order?.address
    const invoiceLines = order?.items
      ?.map(
        (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.product?.name ?? "Product #" + item.product_id}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
          </tr>`,
      )
      .join("") ?? ""

    printWindow.document.write(`
      <html>
      <head><title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .title { font-size: 24px; font-weight: bold; margin: 0; }
        .subtitle { color: #666; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { text-align: left; padding: 8px; border-bottom: 2px solid #111; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .total-row { font-weight: bold; font-size: 16px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">INVOICE</h1>
            <p class="subtitle">${invoice.invoice_number}</p>
            <p class="subtitle">Issued: ${invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "N/A"}</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0;">Lumen Store</h2>
            <p style="margin:2px 0;color:#666;">support@lumenstore.com</p>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
          <div>
            <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">Bill To:</p>
            <p style="margin:2px 0;">${customer?.full_name ?? "N/A"}</p>
            <p style="margin:2px 0;">${customer?.email ?? ""}</p>
            <p style="margin:2px 0;">${customer?.phone ?? ""}</p>
            <p style="margin:2px 0;">${customer?.address_line1 ?? ""}, ${customer?.city ?? ""}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">Order:</p>
            <p style="margin:2px 0;">${order?.order_number ?? ""}</p>
            <p style="margin:2px 0;">Status: ${order?.status ?? ""}</p>
            <p style="margin:2px 0;">Payment: ${paymentMethodLabel(order?.payment_method)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceLines}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;padding:8px;font-weight:bold;">Invoice Total:</td>
              <td style="text-align:right;padding:8px;font-weight:bold;">${formatPrice(invoice.total_amount)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align:right;padding:8px;">Paid:</td>
              <td style="text-align:right;padding:8px;">${formatPrice(invoice.paid_amount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;padding:8px;border-top:2px solid #111;">Balance Due:</td>
              <td style="text-align:right;padding:8px;border-top:2px solid #111;">${formatPrice(invoice.remaining_amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Lumen Store — support@lumenstore.com</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }, [order])

  // Reload when payment modal closes
  useEffect(() => {
    if (!showPaymentForm) {
      setPaymentOptions(null)
    }
  }, [showPaymentForm])

  if (authLoading) return null

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
          <Skeleton className="mt-6 h-48 w-full rounded-xl" />
        </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Order not found"
            description="This order could not be loaded or does not exist."
            action={<Link href="/dashboard/orders"><Button variant="outline">Back to orders</Button></Link>}
          />
        </div>
    )
  }

  // Get invoices from the order response (has full Invoice type with formatted fields)
  // or fall back to the payment summary's simplified invoice data
  const invoices: Invoice[] = (order?.invoices?.length ? order.invoices : (paymentSummary?.invoices ?? [])) as Invoice[]
  const payments = paymentSummary?.payments ?? []

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/dashboard/orders" className="hover:text-foreground transition-colors">Orders</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">#{order.order_number}</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ShoppingCart className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">#{order.order_number}</h1>
                <Badge className={statusStyles[optimisticStatus ?? order.status] ?? ""}>{optimisticStatus ?? order.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/orders")}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left column — Customer and Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <User className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Customer Information</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{order.address?.full_name ?? order.user?.full_name ?? "N/A"}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {(order.address?.email || order.user?.email) && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {order.address?.email || order.user?.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {order.user?.phone ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="size-3.5" />
                      {order.user.phone}
                    </span>
                  ) : order.address?.phone ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="size-3.5" />
                      {order.address.phone}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    {paymentMethodLabel(order.payment_method)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <MapPin className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Shipping Address</h2>
              </div>
              <div className="p-5 space-y-1 text-sm">
                <p className="font-medium">{order.address?.full_name ?? "N/A"}</p>
                <p className="text-muted-foreground">{order.address?.address_line1 ?? ""}</p>
                {order.address?.address_line2 && (
                  <p className="text-muted-foreground">{order.address.address_line2}</p>
                )}
                <p className="text-muted-foreground">
                  {[order.address?.city, order.address?.country].filter(Boolean).join(", ")}
                </p>
                {order.address?.postal_code && (
                  <p className="text-muted-foreground">{order.address.postal_code}</p>
                )}
                {order.address?.phone && (
                  <p className="flex items-center gap-1 text-muted-foreground mt-2">
                    <Phone className="size-3.5" />
                    {order.address.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Products card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Package className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Products ({order.items?.length ?? 0})</h2>
              </div>
              <div className="divide-y divide-border">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Package className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.product?.name ?? `Product #${item.product_id}`}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <p className="font-medium shrink-0 ml-4">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-muted/30">
                <span className="text-sm font-semibold">Order Total</span>
                <span className="text-lg font-bold">{formatPrice(order.total_price)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-2">Order Notes</h2>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Right column — Status, Invoices, Payments */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <ShoppingCart className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Order Status</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current</span>
                  <Badge className={statusStyles[optimisticStatus ?? order.status] ?? ""}>{optimisticStatus ?? order.status}</Badge>
                </div>
                {STATUS_TRANSITIONS[optimisticStatus ?? order.status]?.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground">Update to:</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_TRANSITIONS[optimisticStatus ?? order.status]
                        .filter((s) => s !== "cancelled")
                        .map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            disabled={reduxUpdatingIds.includes(orderId)}
                            onClick={() => handleStatusUpdate(s)}
                          >
                            {reduxUpdatingIds.includes(orderId) ? "..." : `Mark ${s}`}
                          </Button>
                        ))}
                      {STATUS_TRANSITIONS[optimisticStatus ?? order.status].includes("cancelled") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reduxUpdatingIds.includes(orderId)}
                          onClick={() => handleStatusUpdate("cancelled")}
                        >
                          {reduxUpdatingIds.includes(orderId) ? "..." : "Cancel order"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (optimisticStatus ?? order.status) === "delivered" ? (
                  <div className="pt-2 border-t border-border">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 w-full justify-center py-1">
                      ✓ Order completed
                    </Badge>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Payment Summary card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Banknote className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Payment Summary</h2>
              </div>
              <div className="p-5 space-y-3">
                {paymentLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : paymentSummary ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Order Total</span>
                      <span className="font-semibold">{formatPrice(paymentSummary.order_total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(paymentSummary.total_paid)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-bold text-base ${paymentSummary.remaining_to_pay > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {formatPrice(paymentSummary.remaining_to_pay)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {paymentSummary.payment_count} payment{paymentSummary.payment_count !== 1 ? "s" : ""} recorded
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
              </div>
            </div>

            {/* Invoices card */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <FileText className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">
                  Invoices ({invoices.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {invoices.length === 0 ? (
                  <div className="p-5 text-sm text-muted-foreground">No invoices for this order.</div>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="px-5 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          <Badge className={`mt-1 ${invoiceStatusStyles[inv.status] ?? ""}`}>
                            {(inv as any).status_label ?? inv.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatPrice(inv.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid: {formatPrice(inv.paid_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              inv.status === "paid"
                                ? "bg-emerald-500"
                                : inv.status === "partially_paid"
                                  ? "bg-amber-500"
                                  : "bg-muted-foreground/20"
                            }`}
                            style={{
                              width: `${Math.min(100, (inv.paid_amount / inv.total_amount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {inv.total_amount > 0
                            ? Math.round((inv.paid_amount / inv.total_amount) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inv.status !== "paid" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => loadPaymentOptions(inv)}
                          >
                            <Banknote className="size-3" />
                            Record payment
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handlePrintInvoice(inv)}
                        >
                          <Printer className="size-3" />
                          Print
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">
                    Payment History ({payments.length})
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {payments.map((pmt) => (
                    <div key={pmt.id} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{pmt.payment_type_label}</p>
                        <p className="text-xs text-muted-foreground">
                          {pmt.paid_at
                            ? new Date(pmt.paid_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{pmt.amount_formatted}</p>
                        <Badge variant={pmt.status === "paid" ? "default" : "secondary"} className="text-[10px] h-4">
                          {pmt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentForm && selectedInvoice && paymentOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-semibold">Record Payment</h2>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Invoice</p>
                <p className="font-medium">{selectedInvoice.invoice_number}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {paymentOptions.remaining_formatted}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Amount</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(paymentOptions.options).map(([key, opt]) => (
                    <button
                      key={key}
                      onClick={() => setPaymentType(key)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                        paymentType === key
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.amount_formatted ?? `Up to ${opt.max_formatted}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {paymentType === "custom" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Enter Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={paymentOptions.remaining}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-8 w-full rounded-lg border border-input bg-transparent pl-7 pr-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  {paymentOptions.options.custom.max && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: {paymentOptions.options.custom.max_formatted}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleRecordPayment}
                  disabled={recordingPayment || (paymentType === "custom" && (!customAmount || parseFloat(customAmount) <= 0))}
                >
                  {recordingPayment ? "Recording..." : "Record Payment"}
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function paymentMethodLabel(method?: string): string {
  if (method === "cod") return "Cash on Delivery"
  if (method === "card") return "Card Payment"
  return method ?? "N/A"
}
