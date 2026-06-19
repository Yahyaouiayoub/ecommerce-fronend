"use client"

import { useAppSelector, selectCartSubtotal, selectCartCount } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const SHIPPING_THRESHOLD = 75
const SHIPPING_FEE = 8

export function useOrderTotals() {
  const subtotal = useAppSelector(selectCartSubtotal)
  const count = useAppSelector(selectCartCount)
  const shipping = subtotal === 0 || subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + shipping + tax
  return { subtotal, shipping, tax, total, count }
}

export function OrderSummary({ children }: { children?: React.ReactNode }) {
  const { subtotal, shipping, tax, total } = useOrderTotals()

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="mt-5 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="font-medium">
            {shipping === 0 ? "Free" : formatPrice(shipping)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Estimated tax</dt>
          <dd className="font-medium">{formatPrice(tax)}</dd>
        </div>
      </dl>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">Total</span>
        <span className="text-base font-semibold">{formatPrice(total)}</span>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
