"use client"

import { useState, useEffect, useRef } from "react"
import { Wand } from "lucide-react"
import { useAppSelector, selectCartSubtotal, selectCartCount, selectCouponCode, selectCouponDiscount, selectCouponDetails, selectCouponChecking, selectCouponError, selectCouponIsAutoApply } from "@/lib/store"
import { useAppDispatch } from "@/lib/store"
import { checkCouponAsync, removeCoupon, clearCouponError } from "@/lib/store/coupon-slice"
import { formatPrice } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { getPublicSettings } from "@/lib/api/services"
import { useSharedData } from "@/lib/hooks/use-api"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/hooks/use-auth"
import type { ShippingSettings, TaxSettings, ShippingMethod, PublicSettings } from "@/lib/types"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

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
  const couponDiscount = useAppSelector(selectCouponDiscount)
  const count = useAppSelector(selectCartCount)

  const { data: settings } = useSharedData<PublicSettings>("publicSettings", getPublicSettings)
  const ship = settings?.shipping ?? DEFAULT_SHIPPING
  const taxSettings = settings?.tax ?? DEFAULT_TAX

  // Apply coupon discount to subtotal before shipping/tax
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount)

  // Calculate shipping
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

  // Calculate tax on discounted subtotal
  let tax = 0
  if (taxSettings.enabled) {
    if (taxSettings.type === "percentage") {
      tax = Math.round(discountedSubtotal * (taxSettings.rate / 100) * 100) / 100
    } else {
      tax = taxSettings.rate
    }
  }

  const total = Math.round((discountedSubtotal + shipping + tax) * 100) / 100
  const couponsEnabled = settings?.coupons_enabled ?? true
  return { subtotal, couponDiscount, discountedSubtotal, shipping, tax, total, count, settings: ship, couponsEnabled }
}

export function OrderSummary({ children, selectedShippingMethod, selectedShippingCost }: OrderSummaryProps) {
  const t = useTranslations("checkout")
  const ct = useTranslations("cart")
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { subtotal, couponDiscount, discountedSubtotal, shipping, tax, total, settings, couponsEnabled } = useOrderTotals(selectedShippingCost)

  const couponCode = useAppSelector(selectCouponCode)
  const couponDetails = useAppSelector(selectCouponDetails)
  const couponChecking = useAppSelector(selectCouponChecking)
  const couponError = useAppSelector(selectCouponError)
  const isAutoApply = useAppSelector(selectCouponIsAutoApply)

  const [couponInput, setCouponInput] = useState("")
  const autoApplyAttempted = useRef(false)

  // ── Auto-detect best auto-apply coupon on mount ──
  useEffect(() => {
    if (!couponsEnabled) return
    if (autoApplyAttempted.current) return
    if (couponCode || subtotal <= 0) return

    autoApplyAttempted.current = true

    dispatch(checkCouponAsync({ code: "", subtotal }))
      .unwrap()
      .then((res) => {
        toast.success(`Coupon "${res.code}" applied automatically!`)
      })
      .catch(() => {
        // No auto-apply coupon available — this is fine
      })
  }, [dispatch, subtotal, couponCode, couponsEnabled])

  function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    dispatch(clearCouponError())
    dispatch(checkCouponAsync({ code, subtotal, guestEmail: user ? undefined : undefined }))
      .unwrap()
      .then((res) => {
        toast.success(`Coupon "${res.code}" applied!`)
        setCouponInput("")
      })
      .catch((err) => {
        toast.error(typeof err === "string" ? err : "Invalid coupon")
      })
  }

  function handleRemoveCoupon() {
    dispatch(removeCoupon())
    toast.success("Coupon removed")
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{t("order_summary")}</h2>

      {/* Coupon input — hidden when coupons are globally disabled */}
      {couponsEnabled && (
        <div className="mt-4">
          {couponCode && couponDetails ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-green-700 dark:text-green-300">{couponCode}</span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ({couponDetails.type === "percentage" ? `${couponDetails.value}% off` : `${formatPrice(couponDetails.value)} off`})
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 underline"
                >
                  Remove
                </button>
              </div>
              {isAutoApply && (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Wand className="size-3" />
                  Auto-applied based on your cart
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                placeholder="Coupon code"
                className="flex-1 font-mono text-sm"
                disabled={couponChecking}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponChecking || !couponInput.trim()}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {couponChecking ? "..." : "Apply"}
              </button>
            </div>
          )}
          {couponError && !couponCode && (
            <p className="mt-1 text-xs text-destructive">{couponError}</p>
          )}
        </div>
      )}

      <dl className="mt-5 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{ct("subtotal")}</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>

        {/* Discount line */}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-green-600 dark:text-green-400">
            <dt className="flex items-center gap-1">
              Discount
              {couponCode && <span className="font-mono text-xs">({couponCode})</span>}
            </dt>
            <dd className="font-medium">-{formatPrice(couponDiscount)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{ct("shipping")}</dt>
          <dd className="font-medium">
            {shipping === 0 ? t("free") : formatPrice(shipping)}
          </dd>
        </div>
        {shipping === 0 && settings.enabled && settings.free_shipping && subtotal > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 -mt-1">
            {ct("free_shipping", { amount: formatPrice(settings.free_shipping_min) })}
          </p>
        )}
        {selectedShippingMethod && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <dt>{selectedShippingMethod.name}</dt>
            {selectedShippingMethod.estimated_days && (
              <dd>{t("estimated_days", { days: selectedShippingMethod.estimated_days })}</dd>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{ct("tax")}</dt>
          <dd className="font-medium">{formatPrice(tax)}</dd>
        </div>
      </dl>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">{ct("total")}</span>
        <span className="text-base font-semibold">{formatPrice(total)}</span>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
