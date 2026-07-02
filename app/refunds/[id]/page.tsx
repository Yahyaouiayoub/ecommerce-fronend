"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  RotateCcw,
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { getMyRefund } from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import { formatPrice } from "@/lib/utils"
import type { Refund } from "@/lib/types"

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="size-12 text-amber-500" />,
  approved: <CheckCircle className="size-12 text-blue-500" />,
  rejected: <XCircle className="size-12 text-red-500" />,
  completed: <CheckCircle className="size-12 text-emerald-500" />,
}

export default function RefundDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const { data: refund, loading, error, reload } = useApi<Refund | null>(
    () => getMyRefund(id),
    [id],
  )

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  if (authLoading) return null

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/refunds" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3.5" />
            My Refunds
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {refund?.refund_number ?? `#${id}`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : error || !refund ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Refund not found"
            description="This refund request could not be loaded."
            action={
              <Link href="/refunds">
                <Button variant="outline">Back to refunds</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Status Hero */}
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="flex justify-center mb-4">
                {statusIcons[refund.status] ?? <RotateCcw className="size-12 text-muted-foreground" />}
              </div>
              <Badge className={`${statusStyles[refund.status] ?? ""} text-sm px-4 py-1.5`}>
                {refund.status_label}
              </Badge>
              <h1 className="mt-4 text-xl font-semibold tracking-tight">
                {refund.refund_number}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Requested on {new Date(refund.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
              {(refund.approved_at || refund.rejected_at || refund.completed_at) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {refund.approved_at && `Approved: ${new Date(refund.approved_at).toLocaleDateString()}`}
                  {refund.rejected_at && `Rejected: ${new Date(refund.rejected_at).toLocaleDateString()}`}
                  {refund.completed_at && `Completed: ${new Date(refund.completed_at).toLocaleDateString()}`}
                </p>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Refund Amount</p>
                <p className="mt-1.5 text-2xl font-bold text-accent">
                  {formatPrice(refund.refund_amount)}
                </p>
              </div>
              {refund.order && (
                <Link
                  href={`/orders/${refund.order.id}`}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all block"
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order</p>
                  <p className="mt-1.5 text-lg font-semibold">
                    #{refund.order.order_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatPrice(refund.order.total_price)}
                  </p>
                </Link>
              )}
            </div>

            {/* Reason */}
            {refund.reason && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">Reason</h2>
                <p className="mt-2 text-sm text-muted-foreground">{refund.reason}</p>
                {refund.description && (
                  <>
                    <Separator className="my-3" />
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{refund.description}</p>
                  </>
                )}
              </div>
            )}

            {/* Items */}
            {refund.items && refund.items.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Items ({refund.items.length})</h2>
                <div className="divide-y divide-border">
                  {refund.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
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
              </div>
            )}

            {/* Images */}
            {refund.images && refund.images.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">Attached Images ({refund.images.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Notes (visible to customer if any) */}
            {refund.internal_notes && refund.status !== "pending" && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-2">Staff Notes</h2>
                <p className="text-sm text-muted-foreground">{refund.internal_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
