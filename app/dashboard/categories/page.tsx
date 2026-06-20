"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { AlertCircle, Layers, Plus, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  getCategories,
  adminCreateCategoryMultipart,
  adminUpdateCategoryMultipart,
  adminDeleteCategory,
} from "@/lib/api/services"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import type { Category, AdminCategoryPayload } from "@/lib/types"
import { toast } from "sonner"

export default function AdminCategoriesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data, loading, error, reload } = useApi<Category[]>(() => getCategories(), [])
  
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null)
  const [deletingIds, setDeletingIds] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const displayCategories = localCategories ?? data

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (data && localCategories === null) {
      setLocalCategories(data)
    }
  }, [data, localCategories])

  function resetForm() {
    setForm({ name: "", description: "" })
    setEditCat(null)
    setShowForm(false)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
  }

  function openEdit(cat: Category) {
    setEditCat(cat)
    setForm({ name: cat.name, description: cat.description ?? "" })
    if (cat.image) {
      setImagePreview(getImageUrl(cat.image))
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

      if (editCat) {
        if (removeImage) {
          formData.append("remove_image", "1")
        }
        setLocalCategories((prev) =>
          prev?.map((c) =>
            c.id === editCat.id ? { ...c, name: form.name, description: form.description } : c,
          ) ?? null,
        )
        await adminUpdateCategoryMultipart(editCat.id, formData)
        toast.success("Category updated")
      } else {
        await adminCreateCategoryMultipart(formData)
        toast.success("Category created")
      }
      resetForm()
      if (!editCat) reload()
      else reload()
    } catch (err) {
      setLocalCategories(null)
      reload()
      toast.error(getApiErrorMessage(err, "Failed to save category"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? Products in this category will also be deleted.`)) return
    setDeletingIds((prev) => [...prev, id])
    setLocalCategories((prev) => prev?.filter((c) => c.id !== id) ?? null)
    try {
      await adminDeleteCategory(id)
      toast.success("Category deleted")
    } catch (err) {
      setLocalCategories(null)
      reload()
      toast.error(getApiErrorMessage(err, "Failed to delete category"))
    } finally {
      setDeletingIds((prev) => prev.filter((did) => did !== id))
    }
  }

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayCategories ? `${displayCategories.length} categories` : "Organize your products"}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="size-4" />
            Add category
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4"
            encType="multipart/form-data"
          >
            <h2 className="font-semibold">
              {editCat ? "Edit category" : "New category"}
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
                <label className="text-sm font-medium">Category Image</label>
                <div className="mt-1 flex items-start gap-4">
                  {(imagePreview || (editCat?.image && !removeImage)) ? (
                    <div className="relative size-24 shrink-0">
                      <img
                        src={imagePreview ?? getImageUrl(editCat?.image)}
                        alt="Category image preview"
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
                {saving ? "Saving..." : editCat ? "Update category" : "Create category"}
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
            title="Couldn't load categories"
            action={<Button onClick={reload} variant="outline">Try again</Button>}
          />
        ) : !displayCategories || displayCategories.length === 0 ? (
          <StateMessage
            icon={<Layers className="size-6" />}
            title="No categories yet"
            description="Create your first category to organize products."
          />
        ) : (
          <div className="mt-6 space-y-2">
            {displayCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  {cat.image ? (
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      className="size-9 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Layers className="size-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.products_count ?? 0} products
                      {cat.description ? ` — ${cat.description}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cat.is_active ? "default" : "outline"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="xs" onClick={() => openEdit(cat)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-destructive hover:text-destructive"
                    disabled={deletingIds.includes(cat.id)}
                  >
                    {deletingIds.includes(cat.id) ? "..." : <Trash2 className="size-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  )
}
