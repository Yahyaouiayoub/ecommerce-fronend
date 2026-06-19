"use client"

import Link from "next/link"
import Image from "next/image"
import { Package } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { useApi } from "@/lib/hooks/use-api"
import { getImageUrl } from "@/lib/api/client"
import { getOrders } from "@/lib/api/services"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Order } from "@/lib/types"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useEffect } from "react"
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
  const { data, error, loading } = useApi<Order[]>(() => getOrders(), [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders")
    }
  }, [authLoading, user, router])

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and review your past purchases.
        </p>

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

          {!loading && !error && data?.length === 0 && (
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
            data?.map((order) => (
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
                        <Image
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
              </div>
            ))}
        </div>
      </div>
    </SiteShell>
  )
}
