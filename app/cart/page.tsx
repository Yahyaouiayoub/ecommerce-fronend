"use client"

import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { OrderSummary } from "@/components/order-summary"
import { StateMessage } from "@/components/state-message"
import { StoreImage } from "@/components/store-image"
import { toast } from "sonner"
import { cn, formatPrice } from "@/lib/utils"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectCartItems } from "@/lib/store"
import {
  removeFromCartAsync,
  updateQuantityAsync,
  updateQuantity,
  clearCartAsync,
} from "@/lib/store/cart-slice"
import { useTranslations } from "next-intl"

export default function CartPage() {
  const t = useTranslations("cart")
  const items = useAppSelector(selectCartItems)
  const dispatch = useAppDispatch()

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

        {items.length === 0 ? (
          <div className="mt-8">
            <StateMessage
              icon={<ShoppingBag className="size-6" />}
              title={t("empty")}
              description={t("empty_desc")}
              action={
                <Link 
                  href="/products" 
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  {t("start_shopping")}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 p-4">
                    <Link
                      href={`/products/${item.id}`}
                      className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <StoreImage
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() =>
                            dispatch(removeFromCartAsync({ id: item.id, cartItemId: item.cartItemId }))
                              .unwrap()
                              .catch((err) => toast.error(getApiErrorMessage(err, "Could not remove item.")))
                          }
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <span className="mt-1 text-sm text-muted-foreground">
                        {t("each", { price: formatPrice(item.price) })}
                      </span>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-l-lg disabled:opacity-30"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                            onClick={() => {
                              const newQty = item.quantity - 1
                              // Optimistic: update UI instantly
                              dispatch(updateQuantity({ id: item.id, quantity: newQty }))
                              // Background API sync
                              dispatch(
                                updateQuantityAsync({
                                  id: item.id,
                                  cartItemId: item.cartItemId,
                                  quantity: newQty,
                                }),
                              ).catch((err) => {
                                // Rollback on failure
                                dispatch(updateQuantity({ id: item.id, quantity: item.quantity }))
                                toast.error(getApiErrorMessage(err, "Could not update quantity."))
                              })
                            }}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-r-lg disabled:opacity-30"
                            aria-label="Increase quantity"
                            onClick={() => {
                              const newQty = item.quantity + 1
                              // Optimistic: update UI instantly
                              dispatch(updateQuantity({ id: item.id, quantity: newQty }))
                              // Background API sync
                              dispatch(
                                updateQuantityAsync({
                                  id: item.id,
                                  cartItemId: item.cartItemId,
                                  quantity: newQty,
                                }),
                              ).catch((err) => {
                                // Rollback on failure
                                dispatch(updateQuantity({ id: item.id, quantity: item.quantity }))
                                toast.error(getApiErrorMessage(err, "Could not update quantity."))
                              })
                            }}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          {item.stock && (
                            <p className={cn(
                              "text-xs mt-0.5",
                              item.stock < 6 ? "text-amber-600" : "text-muted-foreground"
                            )}>
                              {t("x_in_stock", { stock: item.stock })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-between">
                <Link 
                  href="/products" 
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg hover:bg-muted hover:text-foreground px-3 py-1 text-sm font-medium transition-colors"
                >
                  {t("continue_shopping")}
                </Link>
                <button 
                  onClick={() =>
                    dispatch(clearCartAsync())
                      .unwrap()
                      .catch((err) => toast.error(getApiErrorMessage(err, "Could not clear cart on server.")))
                  }
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg hover:bg-muted hover:text-foreground px-3 py-1 text-sm font-medium transition-colors"
                >
                  {t("clear_cart")}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <OrderSummary>
                <Link 
                  href="/checkout" 
                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  {t("proceed_checkout")}
                </Link>
              </OrderSummary>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  )
}