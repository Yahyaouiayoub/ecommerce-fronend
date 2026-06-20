"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { AlertCircle, Plus, Trash2, Tag, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  getBrands,
  adminCreateBrandMultipart,
  adminUpdateBrandMultipart,
  adminDeleteBrand,
} from "@/lib/api/services"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import type { Brand, AdminBrandPayload } from "@/lib/types"
import { toast } from "sonner"

export default function AdminBrandsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data, loading, error, reload } = useApi<Brand[]>(() => getBrands(), [])

  const [localBrands, setLocalBrands] = useState<Brand[] | null>(null)
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editBrand, setEditBrand] = useState<Brand | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const displayBrands = localBrands ?? data

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  // Keep localBrands in sync with server data
  useEffect(() => {
    if (data) {
      setLocalBrands(data)
    }
  }, [data])

  function resetForm() {
    setForm({ name: "", description: "" })
    setEditBrand(null)
    setShowForm(false)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
  }

  function openEdit(brand: Brand) {
    setEditBrand(brand)
    setForm({ name: brand.name, description: brand.description ?? "" })
    if (brand.image) {
      setImagePreview(getImageUrl(brand.image))
    }
    setShowForm(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setRemoveImage(false)
    }
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append("name", form.name)
      if (form.description) formData.append("description", form.description)

      if (imageFile) {
        formData.append("image", imageFile)
      }

      if (editBrand) {
        if (removeImage) {
          formData.append("remove_image", "1")
        }
        // Optimistic update
        setLocalBrands((prev) =>
          prev?.map((b) =>
            b.id === editBrand.id
              ? { ...b, name: form.name, description: form.description }
              : b,
          ) ?? null,
        )
        await adminUpdateBrandMultipart(editBrand.id, formData)
        toast.success("Brand updated")
      } else {
        await adminCreateBrandMultipart(formData)
        toast.success("Brand created")
      }
      resetForm()
      reload()
    } catch (err) {
      setLocalBrands(null)
      reload()
      toast.error(getApiErrorMessage(err, "Failed to save brand"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete brand "${name}"? Products with this brand will be unlinked.`)) return
    setDeletingIds((prev) => [...prev, id])
    setLocalBrands((prev) => prev?.filter((b) => b.id !== id) ?? null)
    try {
      await adminDeleteBrand(id)
      toast.success("Brand deleted")
    } catch (err) {
      setLocalBrands(null)
      reload()
      toast.error(getApiErrorMessage(err, "Failed to delete brand"))
    } finally {
      setDeletingIds((prev) => prev.filter((did) => did !== id))
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayBrands ? `${displayBrands.length} brands` : "Manage product brands"}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="size-4" />
            Add brand
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4"
            encType="multipart/form-data"
          >
            <h2 className="font-semibold">
              {editBrand ? "Edit brand" : "New brand"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              {/* Image upload */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Brand Image</label>
                <div className="mt-1 flex items-start gap-4">
                  {(imagePreview || (editBrand?.image && !removeImage)) ? (
                    <div className="relative size-24 shrink-0">
                      <img
                        src={imagePreview ?? getImageUrl(editBrand?.image)}
                        alt="Brand image preview"
                        className="size-24 rounded-lg object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="flex size-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {!imagePreview && (
                    <p className="text-xs text-muted-foreground self-center">
                      Click to upload an image (JPEG, PNG, WebP, max 2MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editBrand ? "Update brand" : "Create brand"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load brands"
            action={<Button onClick={reload} variant="outline">Try again</Button>}
          />
        ) : !displayBrands || displayBrands.length === 0 ? (
          <StateMessage
            icon={<Tag className="size-6" />}
            title="No brands yet"
            description="Create your first brand to organize products."
          />
        ) : (
          <div className="mt-6 space-y-2">
            {displayBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  {brand.image ? (
                    <img
                      src={getImageUrl(brand.image)}
                      alt={brand.name}
                      className="size-9 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Tag className="size-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {brand.products_count ?? 0} products
                      {brand.description ? ` — ${brand.description}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={brand.is_active ? "default" : "outline"}>
                    {brand.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="xs" onClick={() => openEdit(brand)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDelete(brand.id, brand.name)}
                    className="text-destructive hover:text-destructive"
                    disabled={deletingIds.includes(brand.id)}
                  >
                    {deletingIds.includes(brand.id) ? "..." : <Trash2 className="size-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  )
}
