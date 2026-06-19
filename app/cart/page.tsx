"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { OrderSummary } from "@/components/order-summary"
import { StateMessage } from "@/components/state-message"
import { formatPrice } from "@/lib/utils"
import { useAppDispatch, useAppSelector, selectCartItems } from "@/lib/store"
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "@/lib/store/cart-slice"

export default function CartPage() {
  const items = useAppSelector(selectCartItems)
  const dispatch = useAppDispatch()

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>

        {items.length === 0 ? (
          <div className="mt-8">
            <StateMessage
              icon={<ShoppingBag className="size-6" />}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet."
              action={
                <Link 
                  href="/products" 
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  Start shopping
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
                      href={`/products/${item.slug}`}
                      className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <span className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(item.price)} each
                      </span>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-l-lg"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                }),
                              )
                            }
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-r-lg"
                            aria-label="Increase quantity"
                            onClick={() =>
                              dispatch(
                                updateQuantity({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                }),
                              )
                            }
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
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
                  Continue shopping
                </Link>
                <button 
                  onClick={() => dispatch(clearCart())}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg hover:bg-muted hover:text-foreground px-3 py-1 text-sm font-medium transition-colors"
                >
                  Clear cart
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
                  Proceed to checkout
                </Link>
              </OrderSummary>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  )
}