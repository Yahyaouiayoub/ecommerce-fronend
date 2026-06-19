"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { OrderSummary } from "@/components/order-summary"
import { StateMessage } from "@/components/state-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import {
  useAppDispatch,
  useAppSelector,
  selectCartItems,
} from "@/lib/store"
import { clearCart } from "@/lib/store/cart-slice"
import { createOrder, type CheckoutPayload } from "@/lib/api/services"
import { toast } from "sonner"

const PAYMENT_METHODS = [
  { value: "card", label: "Credit / Debit card" },
  { value: "paypal", label: "PayPal" },
  { value: "cod", label: "Cash on delivery" },
]

export default function CheckoutPage() {
  const items = useAppSelector(selectCartItems)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [payment, setPayment] = useState("card")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: CheckoutPayload = {
      payment_method: payment,
      shipping_address: {
        full_name: String(form.get("full_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        postal_code: String(form.get("postal_code") ?? ""),
        country: String(form.get("country") ?? ""),
      },
    }

    setSubmitting(true)
    try {
      // POST /orders to the Laravel backend
      const order = await createOrder(payload)
      dispatch(clearCart())
      toast.success("Order placed successfully")
      router.push(`/order-confirmation/${order.id}`)
    } catch {
      toast.error(
        "Could not place order. Connect your Laravel API at POST /orders.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <div className="mt-8">
            <StateMessage
              icon={<ShoppingBag className="size-6" />}
              title="Your cart is empty"
              description="Add some products before checking out."
              action={
                <Button asChild>
                  <Link href="/products">Browse products</Link>
                </Button>
              }
            />
          </div>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-3"
        >
          {/* Details */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Contact information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" required className="mt-1.5" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Shipping address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Street address</Label>
                  <Input id="address" name="address" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal code</Label>
                  <Input id="postal_code" name="postal_code" required className="mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" required className="mt-1.5" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <div className="mt-4 flex flex-col gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.value}
                      checked={payment === method.value}
                      onChange={() => setPayment(method.value)}
                      className="accent-accent"
                    />
                    {method.label}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Payment is processed securely by your Laravel backend.
              </p>
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <OrderSummary>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Placing order..." : "Place order"}
              </Button>
            </OrderSummary>

            <Separator className="my-6" />
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-muted-foreground"
                >
                  <span className="line-clamp-1">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </SiteShell>
  )
}
