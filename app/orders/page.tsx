"use client"

import Link from "next/link"
import { Package, Download, Eye, FileText } from "lucide-react"
import { Pagination } from "@/components/pagination"
import { SiteShell } from "@/components/site-shell"
import { StoreImage } from "@/components/store-image"
import { useApi } from "@/lib/hooks/use-api"
import { getImageUrl } from "@/lib/api/client"
import { getOrders } from "@/lib/api/services"
import { useAuth } from "@/lib/hooks/use-auth"
import { openPdfInNewTab, downloadPdf } from "@/lib/pdf"
import type { Order } from "@/lib/types"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"


const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pending: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "outline",
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, error, loading } = useApi<{
    data: Order[]
    current_page: number
    last_page: number
    total: number
  }>(() => getOrders({ page }), [page])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders")
    }
  }, [authLoading, user, router])

  const orders = data?.data ?? []

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data ? `${data.total} order${data.total !== 1 ? "s" : ""} total` : "Track and review your past purchases."}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </>
          )}

          {!!error && !loading && (
            <StateMessage
              icon={<Package className="size-6" />}
              title="Could not load orders"
              description="There was a problem fetching your orders. Please try again later."
            />
          )}

          {!loading && !error && orders.length === 0 && (
            <StateMessage
              icon={<Package className="size-6" />}
              title="No orders yet"
              description="When you place an order it will show up here."
              action={
                <Button asChild>
                  <Link href="/products">Start shopping</Link>
                </Button>
              }
            />
          )}

          {!loading &&
            !error &&
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Order #{order.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[order.status] ?? "secondary"}>
                      {order.status}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {formatPrice(order.total_price)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <StoreImage
                          src={getImageUrl(
                            item.product.thumbnail ||
                              item.product.images?.[0]?.image_url,
                          )}
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Invoices section for customers */}
                {order.invoices && order.invoices.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Invoices ({order.invoices.length})
                    </p>
                    <div className="space-y-2">
                      {order.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{inv.invoice_number}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${
                              inv.status === "paid"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : inv.status === "unpaid"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            }`}>
                              {inv.status_label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                              title="View invoice"
                            >
                              <FileText className="size-3.5" />
                            </Link>
                            <button
                              onClick={() => openPdfInNewTab(`/invoices/${inv.id}/pdf`)}
                              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                              title="View PDF"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              onClick={() => downloadPdf(`/invoices/${inv.id}/download`, `invoice-${inv.invoice_number}.pdf`)}
                              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                              title="Download PDF"
                            >
                              <Download className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {data && <Pagination currentPage={page} lastPage={data.last_page} onPageChange={setPage} />}
      </div>
    </SiteShell>
  )
}
