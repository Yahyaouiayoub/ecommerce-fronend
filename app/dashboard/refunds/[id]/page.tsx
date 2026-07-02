"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  User,
  Package,
  Calendar,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  DollarSign,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  adminGetRefund,
  adminApproveRefund,
  adminRejectRefund,
  adminCompleteRefund,
  adminUpdateRefundNotes,
} from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import type { Refund } from "@/lib/types"
import { toast } from "sonner"

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="size-5" />,
  approved: <Check className="size-5" />,
  rejected: <X className="size-5" />,
  completed: <Check className="size-5" />,
}

export default function AdminRefundDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const { user, loading: authLoading } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  const { data: refund, loading, error, reload } = useApi<Refund | null>(
    () => adminGetRefund(id),
    [id],
  )

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (refund?.internal_notes) {
      setNotes(refund.internal_notes)
    }
  }, [refund?.internal_notes])

  async function handleAction(action: string) {
    if (action === "reject" && !showRejectForm) {
      setShowRejectForm(true)
      return
    }
    if (action === "reject" && !rejectReason) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setActionLoading(true)
    try {
      if (action === "approve") {
        await adminApproveRefund(id)
        toast.success("Refund approved")
      } else if (action === "reject") {
        await adminRejectRefund(id, rejectReason)
        toast.success("Refund rejected")
        setShowRejectForm(false)
      } else if (action === "complete") {
        await adminCompleteRefund(id)
        toast.success("Refund completed")
      }
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      await adminUpdateRefundNotes(id, notes)
      toast.success("Notes saved")
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save notes"))
    } finally {
      setSavingNotes(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/dashboard/refunds" className="hover:text-foreground transition-colors">Refunds</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{refund?.refund_number ?? `#${id}`}</span>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error || !refund ? (
        <StateMessage
          icon={<AlertCircle className="size-6" />}
          title="Refund not found"
          action={<Link href="/dashboard/refunds"><Button variant="outline">Back to refunds</Button></Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`rounded-xl border p-6 ${
              refund.status === "pending" ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20" :
              refund.status === "approved" ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" :
              refund.status === "rejected" ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" :
              "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`${
                  refund.status === "pending" ? "text-amber-600" :
                  refund.status === "approved" ? "text-blue-600" :
                  refund.status === "rejected" ? "text-red-600" : "text-emerald-600"
                }`}>
                  {statusIcons[refund.status]}
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">{refund.refund_number}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge className={statusStyles[refund.status] ?? ""}>{refund.status_label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Requested {new Date(refund.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {refund.status !== "pending" && (refund.approved_at || refund.rejected_at || refund.completed_at) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {refund.approved_at && `Approved: ${new Date(refund.approved_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                  {refund.rejected_at && `Rejected: ${new Date(refund.rejected_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                  {refund.completed_at && `Completed: ${new Date(refund.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                </p>
              )}
            </div>

            {/* Customer Info */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                Customer Information
              </h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{refund.requester_name}</p>
                {refund.requester_email && (
                  <p className="text-muted-foreground">{refund.requester_email}</p>
                )}
                {refund.order?.address && (
                  <p className="text-xs text-muted-foreground mt-2">{refund.order.address.full_name}</p>
                )}
              </div>
            </div>

            {/* Reason & Description */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-1">Reason for Refund</h2>
              <p className="text-sm font-medium text-accent">{refund.reason}</p>
              {refund.description && (
                <>
                  <Separator className="my-3" />
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Details</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{refund.description}</p>
                </>
              )}
            </div>

            {/* Refund Items */}
            {refund.items && refund.items.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Items ({refund.items.length})</h2>
                <div className="divide-y divide-border">
                  {refund.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <Package className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.orderItem?.product?.name ?? `Product #${item.orderItem?.product_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.orderItem?.price ?? item.amount / item.quantity)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold shrink-0 ml-2">{formatPrice(item.amount)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Refund Amount</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(refund.refund_amount)}</span>
                </div>
              </div>
            )}

            {/* Images */}
            {refund.images && refund.images.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Evidence Images ({refund.images.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {refund.images.map((img) => (
                    <a
                      key={img.id}
                      href={getImageUrl(img.image_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg border border-border overflow-hidden group"
                    >
                      <img
                        src={getImageUrl(img.image_path)}
                        alt="Refund evidence"
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                Internal Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Add internal notes about this refund..."
              />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">Actions</h2>
              <div className="space-y-2">
                {refund.status === "pending" && (
                  <>
                    <Button
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => handleAction("approve")}
                    >
                      <Check className="size-4 mr-1.5" />
                      {actionLoading ? "Processing..." : "Approve Refund"}
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      disabled={actionLoading}
                      onClick={() => handleAction("reject")}
                    >
                      <X className="size-4 mr-1.5" />
                      {actionLoading ? "Processing..." : "Reject Refund"}
                    </Button>
                    {showRejectForm && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Reason for rejection:</p>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          placeholder="Explain why this refund was rejected..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading || !rejectReason}
                            onClick={() => handleAction("reject")}
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowRejectForm(false); setRejectReason("") }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {refund.status === "approved" && (
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => handleAction("complete")}
                  >
                    <Check className="size-4 mr-1.5" />
                    {actionLoading ? "Processing..." : "Mark as Completed"}
                  </Button>
                )}
                {(refund.status === "rejected" || refund.status === "completed") && (
                  <p className="text-sm text-muted-foreground text-center py-2">Terminal state.</p>
                )}
              </div>
            </div>

            {/* Order Info */}
            {refund.order && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Order Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order #</span>
                    <Link
                      href={`/dashboard/orders/${refund.order.id}`}
                      className="font-mono text-accent hover:underline"
                    >
                      {refund.order.order_number}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatPrice(refund.order.total_price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">{refund.order.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(refund.order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/orders/${refund.order.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Order
                  </Button>
                </Link>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="font-semibold text-accent">{formatPrice(refund.refund_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{refund.items?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span>{refund.images?.length ?? 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-xs">{new Date(refund.created_at).toLocaleDateString()}</span>
                </div>
                {refund.approved_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="text-xs">{new Date(refund.approved_at).toLocaleDateString()}</span>
                  </div>
                )}
                {refund.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-xs">{new Date(refund.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
