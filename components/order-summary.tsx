"use client"

import { useAppSelector, selectCartSubtotal, selectCartCount } from "@/lib/store"
import { formatPrice } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { getPublicSettings } from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import type { ShippingSettings, TaxSettings, ShippingMethod } from "@/lib/types"

const DEFAULT_SHIPPING: ShippingSettings = {
  enabled: true,
  free_shipping: true,
  free_shipping_min: 75,
  standard_cost: 8,
  message: "Free shipping on orders over $75",
}

const DEFAULT_TAX: TaxSettings = {
  enabled: true,
  rate: 8,
  type: "percentage",
  label: "Estimated tax",
}

interface OrderSummaryProps {
  children?: React.ReactNode
  selectedShippingMethod?: ShippingMethod
  selectedShippingCost?: number
}

export function useOrderTotals(selectedShippingCost?: number) {
  const subtotal = useAppSelector(selectCartSubtotal)
  const count = useAppSelector(selectCartCount)

  const { data: settings } = useApi(() => getPublicSettings(), [])
  const ship = settings?.shipping ?? DEFAULT_SHIPPING
  const taxSettings = settings?.tax ?? DEFAULT_TAX

  // Calculate shipping
  // If a selected shipping cost is provided, use it (passed from checkout page)
  // Otherwise fall back to standard cost from settings
  let shipping = 0
  if (ship.enabled && subtotal > 0) {
    if (selectedShippingCost !== undefined) {
      shipping = selectedShippingCost
    } else if (ship.free_shipping && subtotal >= ship.free_shipping_min) {
      shipping = 0
    } else {
      shipping = ship.standard_cost
    }
  }

  // Calculate tax
  let tax = 0
  if (taxSettings.enabled) {
    if (taxSettings.type === "percentage") {
      tax = Math.round(subtotal * (taxSettings.rate / 100) * 100) / 100
    } else {
      tax = taxSettings.rate
    }
  }

  const total = Math.round((subtotal + shipping + tax) * 100) / 100
  return { subtotal, shipping, tax, total, count, settings: ship }
}

export function OrderSummary({ children, selectedShippingMethod, selectedShippingCost }: OrderSummaryProps) {
  const { subtotal, shipping, tax, total, settings } = useOrderTotals(selectedShippingCost)

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
        {shipping === 0 && settings.enabled && settings.free_shipping && subtotal > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 -mt-1">
            Free shipping on orders over {formatPrice(settings.free_shipping_min)}
          </p>
        )}
        {selectedShippingMethod && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <dt>{selectedShippingMethod.name}</dt>
            {selectedShippingMethod.estimated_days && (
              <dd>~{selectedShippingMethod.estimated_days} days</dd>
            )}
          </div>
        )}
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
