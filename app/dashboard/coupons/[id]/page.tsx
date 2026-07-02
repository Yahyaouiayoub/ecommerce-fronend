"use client"

import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/hooks/use-auth"
import { adminGetCoupon, adminCreateCoupon, adminUpdateCoupon, adminGetProducts, type CouponFormData } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import type { Coupon } from "@/lib/types"
import { toast } from "sonner"

const DEFAULT_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: 10,
  is_active: true,
  is_auto_apply: false,
  starts_at: "",
  expires_at: "",
  min_order_amount: "",
  max_discount_amount: "",
  usage_limit: "",
  per_customer_limit: 1,
  applies_to: "all" as "all" | "specific",
  product_ids: [] as number[],
  description: "",
}

export default function CouponFormPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const isEdit = params?.id && params.id !== "new"
  const [loading, setLoading] = useState(!!isEdit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (isEdit) {
      adminGetCoupon(Number(params.id))
        .then((res) => {
          const c = res.coupon
          setForm({
            code: c.code,
            type: c.type,
            value: c.value,
            is_active: c.is_active,
            is_auto_apply: c.is_auto_apply ?? false,
            starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
            expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
            min_order_amount: c.min_order_amount?.toString() ?? "",
            max_discount_amount: c.max_discount_amount?.toString() ?? "",
            usage_limit: c.usage_limit?.toString() ?? "",
            per_customer_limit: c.per_customer_limit,
            applies_to: c.applies_to,
            product_ids: c.products?.map((p) => p.id) ?? [],
            description: c.description ?? "",
          })
        })
        .catch(() => toast.error("Failed to load coupon"))
        .finally(() => setLoading(false))
    }

    // Load products for product-specific coupons
    adminGetProducts({ per_page: 1000 })
      .then((res) => setProducts(res.data.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => {})
  }, [isEdit, params?.id])

  function toggleProduct(id: number) {
    setForm((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter((pid) => pid !== id)
        : [...prev.product_ids, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload: CouponFormData = {
      code: form.code.toUpperCase().replace(/\s+/g, "_"),
      type: form.type,
      value: form.value,
      is_active: form.is_active,
      is_auto_apply: form.is_auto_apply,
      per_customer_limit: form.per_customer_limit,
      applies_to: form.applies_to,
      description: form.description || null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      product_ids: form.applies_to === "specific" ? form.product_ids : [],
    }

    try {
      if (isEdit) {
        await adminUpdateCoupon(Number(params.id), payload)
        toast.success("Coupon updated")
      } else {
        await adminCreateCoupon(payload)
        toast.success("Coupon created")
      }
      router.push("/dashboard/coupons")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save coupon"))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/coupons"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to coupons
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        {isEdit ? `Edit Coupon: ${form.code}` : "New Coupon"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })}
                placeholder="SUMMER20"
                required
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })} className="mt-1">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Value *</label>
              <Input
                type="number"
                min={0.01}
                max={form.type === "percentage" ? 100 : 999999}
                step={0.01}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Per Customer Limit</label>
              <Input
                type="number"
                min={1}
                value={form.per_customer_limit}
                onChange={(e) => setForm({ ...form, per_customer_limit: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Minimum Order Amount</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Discount Amount</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.max_discount_amount}
                onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                placeholder="For percentage caps"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Usage Limit</label>
              <Input
                type="number"
                min={1}
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="Unlimited"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Applies To *</label>
              <Select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as "all" | "specific" })} className="mt-1">
                <option value="all">All Products</option>
                <option value="specific">Specific Products</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        {form.applies_to === "specific" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Select Products</h2>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {products.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.product_ids.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="accent-accent"
                  />
                  {p.name}
                </label>
              ))}
            </div>
            {products.length === 0 && <p className="text-sm text-muted-foreground">No products found.</p>}
          </div>
        )}

        {/* Description */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Description (Internal)</h2>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={1000}
            placeholder="Optional notes about this coupon..."
            className="mt-1 h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-accent"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_auto_apply}
              onChange={(e) => setForm({ ...form, is_auto_apply: e.target.checked })}
              className="accent-accent"
            />
            Auto-apply — automatically applies to eligible orders without requiring a code
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/coupons")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
