"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import {
  adminGetHomepageFeature,
  adminCreateHomepageFeature,
  adminUpdateHomepageFeature,
  adminDeleteHomepageFeature,
} from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { getIconByKey, getIconList } from "@/lib/icon-map"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default function AdminHomepageFeatureDetailPage({ params }: Props) {
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

  if (isNew) return <FeatureForm />
  if (id) return <FeatureForm id={Number(id)} />
  return null
}

function FeatureForm({ id }: { id?: number }) {
  const router = useRouter()
  const isNew = !id

  const { data: feature, loading, error } = useApi(
    () => (id ? adminGetHomepageFeature(id) : Promise.resolve(null)),
    [id],
    { keepPreviousData: true },
  )

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [iconSearch, setIconSearch] = useState("")

  const [form, setForm] = useState({
    icon_key: "truck",
    title: "",
    description: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
  })

  // Populate form when editing
  useEffect(() => {
    if (feature) {
      setForm({
        icon_key: feature.icon_key || "truck",
        title: feature.title,
        description: feature.description || "",
        link_url: feature.link_url || "",
        sort_order: feature.sort_order,
        is_active: feature.is_active,
      })
    }
  }, [feature])

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)

      try {
        const payload = {
          icon_key: form.icon_key,
          title: form.title,
          description: form.description || null,
          link_url: form.link_url || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }

        if (isNew) {
          await adminCreateHomepageFeature(payload)
        } else {
          await adminUpdateHomepageFeature(id!, payload)
        }

        router.push("/dashboard/homepage-features")
      } catch (err) {
        console.error("Failed to save feature card", err)
        alert("Failed to save feature card. Please check your input and try again.")
      } finally {
        setSaving(false)
      }
    },
    [form, isNew, id, router],
  )

  const handleDelete = useCallback(async () => {
    if (!id || !confirm("Delete this feature card? This cannot be undone.")) return
    setDeleting(true)
    try {
      await adminDeleteHomepageFeature(id)
      router.push("/dashboard/homepage-features")
    } catch {
      alert("Failed to delete feature card.")
      setDeleting(false)
    }
  }, [id, router])

  // Icon picker
  const allIcons = getIconList()
  const filteredIcons = iconSearch
    ? allIcons.filter(
        (entry) =>
          entry.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
          entry.keywords.some((kw) => kw.toLowerCase().includes(iconSearch.toLowerCase())),
      )
    : allIcons

  const PreviewIcon = getIconByKey(form.icon_key)

  if (!isNew && loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
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
          title="Could not load feature card"
          description="Make sure the feature card exists and the API is running."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + Delete */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/homepage-features"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Features
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
        {isNew ? "New Feature Card" : `Edit: ${feature?.title || ""}`}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Icon Picker */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Icon</h2>

          {/* Selected icon preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {PreviewIcon ? <PreviewIcon className="size-6" /> : <span className="text-2xl">•</span>}
            </div>
            <div>
              <p className="text-sm font-medium">
                {allIcons.find((i) => i.key === form.icon_key)?.label || "Custom"}
              </p>
              <p className="text-xs text-muted-foreground">Key: <code className="font-mono">{form.icon_key}</code></p>
            </div>
          </div>

          {/* Icon grid */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 max-h-60 overflow-y-auto rounded-xl border border-border p-3">
              {filteredIcons.map((entry) => {
                const IconComp = entry.icon
                const isSelected = form.icon_key === entry.key
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => handleChange("icon_key", entry.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all",
                      isSelected
                        ? "bg-accent text-accent-foreground ring-2 ring-accent"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    title={entry.label}
                  >
                    <IconComp className={cn("size-5", isSelected ? "text-accent-foreground" : "")} />
                    <span className="truncate w-full text-[10px] text-center">{entry.label}</span>
                  </button>
                )
              })}
              {filteredIcons.length === 0 && (
                <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
                  No icons found for &quot;{iconSearch}&quot;
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Content</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Free Shipping"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Free shipping on orders over $50"
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">{form.description.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_url">Link URL (optional)</Label>
            <Input
              id="link_url"
              value={form.link_url}
              onChange={(e) => handleChange("link_url", e.target.value)}
              placeholder="/shipping-info"
            />
            <p className="text-xs text-muted-foreground">
              When set, clicking the card will navigate to this URL.
            </p>
          </div>
        </section>

        {/* Display Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Display Settings</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order (lower = first)</Label>
              <Input
                id="sort_order"
                type="number"
                min={0}
                max={999}
                value={form.sort_order}
                onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex h-10 items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleChange("is_active", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-background after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm text-muted-foreground">
                  {form.is_active ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        {form.title && (
          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 max-w-md">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {PreviewIcon ? <PreviewIcon className="size-5" /> : <span className="text-lg">•</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{form.title}</p>
                {form.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{form.description}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/dashboard/homepage-features">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-1.5">
            <Save className="size-4" />
            {saving ? "Saving..." : isNew ? "Create Feature Card" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
