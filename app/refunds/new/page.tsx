"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  RotateCcw,
  ArrowLeft,
  Upload,
  X,
  Package,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { getRefundableItems, createRefund, getOrders } from "@/lib/api/services"
import { formatPrice, cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import type { Order, RefundableItemsResponse } from "@/lib/types"
import { toast } from "sonner"

interface SelectedItem {
  order_item_id: number
  quantity: number
  max_qty: number
  price: number
  product_name: string
}

export default function NewRefundPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedOrderId = searchParams.get("order_id")
  const { user, loading: authLoading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    preselectedOrderId ? Number(preselectedOrderId) : null,
  )
  const [refundableData, setRefundableData] = useState<RefundableItemsResponse | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingRefundable, setLoadingRefundable] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    loadOrders()
  }, [authLoading, user, router])

  useEffect(() => {
    if (selectedOrderId) {
      loadRefundableItems(selectedOrderId)
      setSelectedItems([])
    }
  }, [selectedOrderId])

  async function loadOrders() {
    setLoadingOrders(true)
    setOrdersError(false)
    try {
      const res = await getOrders({ per_page: 100 })
      // Only show delivered/shipped/processing orders
      const eligible = res.data.filter((o) =>
        ["delivered", "shipped", "processing"].includes(o.status)
      )
      setOrders(eligible)
    } catch {
      setOrdersError(true)
    } finally {
      setLoadingOrders(false)
    }
  }

  async function loadRefundableItems(orderId: number) {
    setLoadingRefundable(true)
    try {
      const data = await getRefundableItems(orderId)
      setRefundableData(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load refundable items"))
    } finally {
      setLoadingRefundable(false)
    }
  }

  const toggleItem = useCallback((item: { id: number; product?: { name: string }; price: number; refundable_quantity: number }) => {
    setSelectedItems((prev) => {
      const existing = prev.find((s) => s.order_item_id === item.id)
      if (existing) {
        return prev.filter((s) => s.order_item_id !== item.id)
      }
      return [
        ...prev,
        {
          order_item_id: item.id,
          quantity: item.refundable_quantity,
          max_qty: item.refundable_quantity,
          price: item.price,
          product_name: item.product?.name ?? `Product #${item.id}`,
        },
      ]
    })
  }, [])

  const updateQty = useCallback((orderItemId: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((s) =>
        s.order_item_id === orderItemId
          ? { ...s, quantity: Math.max(1, Math.min(qty, s.max_qty)) }
          : s,
      ),
    )
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages((prev) => [...prev, ...files].slice(0, 5))
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrderId) return
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to refund")
      return
    }
    if (!reason) {
      toast.error("Please provide a reason for the refund")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("order_id", String(selectedOrderId))
      formData.append("reason", reason)
      if (description) formData.append("description", description)
      selectedItems.forEach((item, i) => {
        formData.append(`items[${i}][order_item_id]`, String(item.order_item_id))
        formData.append(`items[${i}][quantity]`, String(item.quantity))
      })
      images.forEach((img) => {
        formData.append("images[]", img)
      })

      const res = await createRefund(formData)
      toast.success("Refund request submitted successfully!")
      router.push(`/refunds/${res.refund.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit refund"))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return null

  if (loadingOrders) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </div>
      </SiteShell>
    )
  }

  if (ordersError) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Failed to load orders"
            action={<Button variant="outline" onClick={loadOrders}>Try again</Button>}
          />
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/refunds" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3.5" />
            My Refunds
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">New Request</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Request a Refund</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select items from a delivered order to request a refund.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Step 1: Select Order */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-1">1. Select Order</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Choose the order you want to request a refund for.
            </p>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No eligible orders found. Only delivered, shipped, or processing orders can be refunded.
              </p>
            ) : (
              <div className="grid gap-2">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      selectedOrderId === order.id
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(order.total_price)} · {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">{order.status}</span>
                      {selectedOrderId === order.id && (
                        <Check className="size-4 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select Items */}
          {selectedOrderId && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold mb-1">2. Select Products</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Choose which items to include in the refund.
              </p>
              {loadingRefundable ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : refundableData?.items ? (
                <div className="space-y-2">
                  {refundableData.items.filter((item) => item.refundable_quantity > 0).map((item) => {
                    const isSelected = selectedItems.some((s) => s.order_item_id === item.id)
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 transition-all ${
                          isSelected ? "border-accent bg-accent/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(item)}
                              className="mt-1 size-4 rounded border-border accent-accent"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.product?.name ?? `Product #${item.product_id}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity} × {formatPrice(item.price)}
                                {item.refundable_quantity < item.quantity && (
                                  <span className="ml-1">
                                    ({item.refundable_quantity} refundable)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{formatPrice(item.max_refund_amount)}</p>
                            {isSelected && (
                              <div className="mt-1 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sel = selectedItems.find((s) => s.order_item_id === item.id)
                                    if (sel) updateQty(item.id, sel.quantity - 1)
                                  }}
                                  className="size-6 rounded border border-border text-xs hover:bg-muted transition-colors"
                                  disabled={!isSelected || (selectedItems.find((s) => s.order_item_id === item.id)?.quantity ?? 1) <= 1}
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-medium">
                                  {selectedItems.find((s) => s.order_item_id === item.id)?.quantity ?? 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sel = selectedItems.find((s) => s.order_item_id === item.id)
                                    if (sel) updateQty(item.id, sel.quantity + 1)
                                  }}
                                  className="size-6 rounded border border-border text-xs hover:bg-muted transition-colors"
                                  disabled={!isSelected || (selectedItems.find((s) => s.order_item_id === item.id)?.quantity ?? 0) >= item.refundable_quantity}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No refundable items found for this order.</p>
              )}

              {selectedItems.length > 0 && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Total Refund Amount</span>
                  <span className="text-lg font-bold text-accent">{formatPrice(totalAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Reason & Details */}
          {selectedItems.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold mb-1">3. Reason for Refund</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Tell us why you're requesting a refund.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <select
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="mt-1.5 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Select a reason...</option>
                    <option value="defective">Defective / Damaged Product</option>
                    <option value="wrong_item">Wrong Item Received</option>
                    <option value="not_as_described">Not as Described</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="size_issue">Size / Fit Issue</option>
                    <option value="duplicate">Duplicate Order</option>
                    <option value="changed_mind">Changed Mind</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Additional Details (optional)</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="mt-1.5 flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                    placeholder="Provide any additional details about your refund request..."
                  />
                </div>
                <div>
                  <Label>Upload Images (optional, max 5)</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Upload photos of the product to support your request (JPEG, PNG, max 5MB each)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {images.map((file, i) => (
                      <div key={i} className="relative size-20 rounded-lg border border-border overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${i + 1}`}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="flex size-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-colors">
                        <ImageIcon className="size-6 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting || !reason} className="gap-1.5">
                {submitting ? "Submitting..." : "Submit Refund Request"}
              </Button>
              <Link href="/refunds">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          )}
        </form>
      </div>
    </SiteShell>
  )
}
