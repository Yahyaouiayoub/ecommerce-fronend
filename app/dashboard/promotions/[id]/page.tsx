"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import {
  adminGetPromotion,
  adminCreatePromotion,
  adminUpdatePromotion,
  adminDeletePromotion,
} from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { getImageUrl } from "@/lib/api/client"
import type { Promotion } from "@/lib/types"
import { cn } from "@/lib/utils"

const POSITION_OPTIONS = [
  { value: "hero_banner", label: "Hero Banner" },
  { value: "announcement_bar", label: "Announcement Bar" },
  { value: "both", label: "Both" },
]

interface Props {
  params: Promise<{ id: string }>
}

export default function AdminPromotionDetailPage({ params }: Props) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    params.then((p) => {
      if (p.id === "new") {
        setIsNew(true)
      } else {
        setId(p.id)
      }
    })
  }, [params])

  if (isNew) return <PromotionForm />
  if (id) return <PromotionForm id={Number(id)} />
  return null
}

function PromotionForm({ id }: { id?: number }) {
  const router = useRouter()
  const isNew = !id

  const { data: promotion, loading, error } = useApi(
    () => (id ? adminGetPromotion(id) : Promise.resolve(null)),
    [id],
    { keepPreviousData: true },
  )

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [mobileFile, setMobileFile] = useState<File | null>(null)
  const [previewBg, setPreviewBg] = useState<string | null>(null)
  const [previewMobile, setPreviewMobile] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    cta_text: "",
    cta_url: "",
    background_color: "",
    text_color: "",
    discount_text: "",
    badge: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    priority: 0,
    position: "hero_banner" as string,
  })

  // Populate form when editing
  useEffect(() => {
    if (promotion) {
      setForm({
        title: promotion.title,
        subtitle: promotion.subtitle || "",
        description: promotion.description || "",
        cta_text: promotion.cta_text || "",
        cta_url: promotion.cta_url || "",
        background_color: promotion.background_color || "",
        text_color: promotion.text_color || "",
        discount_text: promotion.discount_text || "",
        badge: promotion.badge || "",
        starts_at: promotion.starts_at ? promotion.starts_at.slice(0, 16) : "",
        ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 16) : "",
        is_active: promotion.is_active,
        priority: promotion.priority,
        position: promotion.position,
      })
    }
  }, [promotion])

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgFile(file)
    setPreviewBg(URL.createObjectURL(file))
  }

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMobileFile(file)
    setPreviewMobile(URL.createObjectURL(file))
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)

      try {
        const formData = new FormData()

        // Add all form fields
        formData.append("title", form.title)
        formData.append("position", form.position)

        if (form.subtitle) formData.append("subtitle", form.subtitle)
        if (form.description) formData.append("description", form.description)
        if (form.cta_text) formData.append("cta_text", form.cta_text)
        if (form.cta_url) formData.append("cta_url", form.cta_url)
        if (form.background_color) formData.append("background_color", form.background_color)
        if (form.text_color) formData.append("text_color", form.text_color)
        if (form.discount_text) formData.append("discount_text", form.discount_text)
        if (form.badge) formData.append("badge", form.badge)
        if (form.starts_at) formData.append("starts_at", form.starts_at)
        if (form.ends_at) formData.append("ends_at", form.ends_at)
        formData.append("is_active", form.is_active ? "1" : "0")
        formData.append("priority", String(form.priority))

        // Add images from React state
        if (bgFile) formData.append("background_image", bgFile)
        if (mobileFile) formData.append("mobile_image", mobileFile)

        if (isNew) {
          await adminCreatePromotion(formData)
        } else {
          await adminUpdatePromotion(id!, formData)
        }

        router.push("/dashboard/promotions")
      } catch (err) {
        console.error("Failed to save promotion", err)
        alert("Failed to save promotion. Please check your input and try again.")
      } finally {
        setSaving(false)
      }
    },
    [form, isNew, id, router, bgFile, mobileFile],
  )

  const handleDelete = useCallback(async () => {
    if (!id || !confirm("Delete this promotion? This cannot be undone.")) return
    setDeleting(true)
    try {
      await adminDeletePromotion(id)
      router.push("/dashboard/promotions")
    } catch {
      alert("Failed to delete promotion.")
      setDeleting(false)
    }
  }, [id, router])

  if (!isNew && loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <StateMessage
          title="Could not load promotion"
          description="Make sure the promotion exists and the API is running."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Delete */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/promotions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Promotions
        </Link>
        {!isNew && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>

      {/* Title */}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {isNew ? "New Promotion" : `Edit: ${promotion?.title || ""}`}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Summer Sale 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Up to 50% off everything"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Badge</Label>
              <Input
                id="badge"
                value={form.badge}
                onChange={(e) => handleChange("badge", e.target.value)}
                placeholder="New · Sale · Limited Time"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="A short description of this promotion..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Call to Action</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta_text">Button Text</Label>
              <Input
                id="cta_text"
                value={form.cta_text}
                onChange={(e) => handleChange("cta_text", e.target.value)}
                placeholder="Shop Now"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_url">Button URL</Label>
              <Input
                id="cta_url"
                value={form.cta_url}
                onChange={(e) => handleChange("cta_url", e.target.value)}
                placeholder="/products?category=sale"
              />
            </div>
          </div>
        </section>

        {/* Display */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Display Settings</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <select
                id="position"
                value={form.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                required
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority (higher = first)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={999}
                value={form.priority}
                onChange={(e) => handleChange("priority", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_text">Discount / Promo Text</Label>
              <Input
                id="discount_text"
                value={form.discount_text}
                onChange={(e) => handleChange("discount_text", e.target.value)}
                placeholder="20% OFF · Free Shipping"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="background_color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background_color"
                  value={form.background_color}
                  onChange={(e) => handleChange("background_color", e.target.value)}
                  placeholder="#1a1a2e or indigo-900"
                  className="flex-1"
                />
                {form.background_color && (
                  <div
                    className="size-10 shrink-0 rounded-lg border border-border"
                    style={{ backgroundColor: form.background_color }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_color">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text_color"
                  value={form.text_color}
                  onChange={(e) => handleChange("text_color", e.target.value)}
                  placeholder="#ffffff or white"
                  className="flex-1"
                />
                {form.text_color && (
                  <div
                    className="size-10 shrink-0 rounded-lg border border-border"
                    style={{ backgroundColor: form.text_color }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Images</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bg-image">Background Image</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="bg-image"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="size-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Click to upload (max 5MB)</span>
                </label>
                <input
                  id="bg-image"
                  type="file"
                  accept="image/jpg,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBgImageChange}
                />
              </div>
              {(previewBg || promotion?.background_image_url) && (
                <div className="relative mt-2 h-24 w-full overflow-hidden rounded-lg border border-border">
                  <img
                    src={previewBg || (promotion?.background_image_url ? getImageUrl(promotion.background_image_url) : "")}
                    alt="Background preview"
                    className="size-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-image">Mobile Image (optional)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="mobile-image"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="size-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Click to upload (max 5MB)</span>
                </label>
                <input
                  id="mobile-image"
                  type="file"
                  accept="image/jpg,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleMobileImageChange}
                />
              </div>
              {(previewMobile || promotion?.mobile_image_url) && (
                <div className="relative mt-2 h-24 w-full overflow-hidden rounded-lg border border-border">
                  <img
                    src={previewMobile || (promotion?.mobile_image_url ? getImageUrl(promotion.mobile_image_url) : "")}
                    alt="Mobile preview"
                    className="size-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Schedule</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Start Date</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => handleChange("starts_at", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">End Date</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => handleChange("ends_at", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-background after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full" />
          </label>
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              When disabled, the promotion will not be displayed on the storefront.
            </p>
          </div>
        </div>

        {/* Preview */}
        {form.title && (
          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div
              className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-lg",
                form.position === "announcement_bar" ? "h-12 py-2" : "h-48",
              )}
            >
              {/* Background image */}
              {(previewBg || promotion?.background_image_url) && (
                <img
                  src={previewBg || (promotion?.background_image_url ? getImageUrl(promotion.background_image_url) : "")}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              )}
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: form.background_color
                    ? `linear-gradient(to right, ${form.background_color}B3, ${form.background_color}4D, transparent 60%)`
                    : "linear-gradient(to right, hsl(var(--foreground) / 0.5), hsl(var(--foreground) / 0.2), transparent 60%)",
                }}
              />
              {/* Content */}
              <div
                className="relative z-10 px-6 py-8 text-center"
                style={{ color: form.text_color || "inherit" }}
              >
                {form.badge && (
                  <Badge variant="outline" className="mb-1 text-[10px]">{form.badge}</Badge>
                )}
                {form.discount_text && (
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    {form.discount_text}
                  </p>
                )}
                <p className="text-sm font-semibold">{form.title}</p>
                {form.subtitle && <p className="text-xs opacity-80">{form.subtitle}</p>}
                {form.cta_text && (
                  <span className="mt-1 inline-block text-xs underline underline-offset-2 opacity-90">
                    {form.cta_text}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/dashboard/promotions">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-1.5">
            <Save className="size-4" />
            {saving ? "Saving..." : isNew ? "Create Promotion" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
