"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import {
  AlertCircle,
  Package,
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
  X,
  Upload,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import {
  getCategories,
  getBrands,
  adminCreateCategory,
  adminCreateBrand,
  adminDeleteProductImage,
  adminCreateProductMultipart,
  adminUpdateProductMultipart,
} from "@/lib/api/services"
import { useAppDispatch, useAppSelector, selectProducts, selectProductsLoading, selectProductsError, selectProductsPagination, selectProductsUpdating } from "@/lib/store"
import { fetchProducts, createProduct, updateProduct, deleteProduct, optimisticRemove } from "@/lib/store/products-slice"
import type { Product, Category, Brand, PaginatedResponse, AdminProductPayload } from "@/lib/types"
import { toast } from "sonner"

export default function AdminProductsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectProducts)
  const loading = useAppSelector(selectProductsLoading)
  const loadError = useAppSelector(selectProductsError)
  const pagination = useAppSelector(selectProductsPagination)
  const updatingIds = useAppSelector(selectProductsUpdating)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data: categories } = useApi<Category[]>(() => getCategories(), [])
  const { data: brands } = useApi<Brand[]>(() => getBrands(), [])

  const [localCategories, setLocalCategories] = useState<Category[] | null>(null)
  const [localBrands, setLocalBrands] = useState<Brand[] | null>(null)

  const displayCategories = localCategories ?? categories
  const displayBrands = localBrands ?? brands

  useEffect(() => {
    if (categories && localCategories === null) setLocalCategories(categories)
  }, [categories, localCategories])
  useEffect(() => {
    if (brands && localBrands === null) setLocalBrands(brands)
  }, [brands, localBrands])

  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")

  // Image upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([])
  const [removeThumbnail, setRemoveThumbnail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const formDefault = useMemo(
    () => ({
      category_id: 0,
      name: "",
      price: "",
      stock: "0",
      description: "",
      brand_id: 0,
      sku: "",
      featured: false,
    }),
    [],
  )
  const [form, setForm] = useState(formDefault)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    dispatch(fetchProducts({ search, page, per_page: 15 }))
  }, [dispatch, search, page])

  function resetForm() {
    setForm(formDefault)
    setEditProduct(null)
    setShowForm(false)
    setShowNewCategory(false)
    setShowNewBrand(false)
    setNewCategoryName("")
    setNewBrandName("")
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setImageFiles([])
    setImagePreviews([])
    setDeleteImageIds([])
    setRemoveThumbnail(false)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setForm({
      category_id: product.category_id,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description ?? "",
      brand_id: product.brand_id ?? 0,
      sku: product.sku ?? "",
      featured: product.featured,
    })
    if (product.thumbnail) {
      setThumbnailPreview(getImageUrl(product.thumbnail))
    }
    setDeleteImageIds([])
    setRemoveThumbnail(false)
    setShowForm(true)
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
      setRemoveThumbnail(false)
    }
  }

  function handleRemoveThumbnail() {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setRemoveThumbnail(true)
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files)
    const currentExisting = editProduct ? (editProduct.images?.length ?? 0) - deleteImageIds.length : 0
    const maxNew = 5 - currentExisting
    const totalAfterAdd = imageFiles.length + newFiles.length
    if (totalAfterAdd > maxNew) {
      toast.error(`Maximum 5 images per product. You can add ${maxNew} more.`)
      newFiles.splice(maxNew - imageFiles.length)
    }
    setImageFiles((prev) => [...prev, ...newFiles].slice(0, Math.max(0, 5 - currentExisting)))
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, Math.max(0, 5 - currentExisting)))
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleRemoveNewImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleRemoveExistingImage(imageId: number) {
    setDeleteImageIds((prev) => [...prev, imageId])
  }

  function handleRestoreImage(imageId: number) {
    setDeleteImageIds((prev) => prev.filter((id) => id !== imageId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append("category_id", String(form.category_id))
      formData.append("name", form.name)
      formData.append("price", form.price)
      formData.append("stock", String(parseInt(form.stock) || 0))
      if (form.description) formData.append("description", form.description)
      if (form.brand_id) formData.append("brand_id", String(form.brand_id))
      if (form.sku) formData.append("sku", form.sku)
      formData.append("featured", form.featured ? "1" : "0")

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile)
      }

      if (editProduct && removeThumbnail) {
        formData.append("remove_thumbnail", "1")
      }

      // Mark images to delete
      if (deleteImageIds.length > 0) {
        deleteImageIds.forEach((id) => formData.append("delete_image_ids[]", String(id)))
      }

      // Add new images
      imageFiles.forEach((file) => formData.append("images[]", file))

      if (editProduct) {
        await adminUpdateProductMultipart(editProduct.id, formData)
        toast.success("Product updated")
      } else {
        await adminCreateProductMultipart(formData)
        toast.success("Product created")
      }
      resetForm()
      dispatch(fetchProducts({ search, page, per_page: 15 }))
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save product"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product? This cannot be undone.")) return
    dispatch(optimisticRemove(id))
    try {
      await dispatch(deleteProduct(id)).unwrap()
      toast.success("Product deleted")
    } catch (err) {
      dispatch(fetchProducts({ search, page, per_page: 15 }))
      toast.error(getApiErrorMessage(err, "Failed to delete product"))
    }
  }

  if (authLoading) return null

  // Count remaining images for display
  const existingImageCount = editProduct
    ? (editProduct.images?.length ?? 0) - deleteImageIds.length
    : 0
  const totalImageCount = existingImageCount + imageFiles.length
  const remainingSlots = 5 - totalImageCount

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items ? `${pagination.total} products total` : "Manage your product catalog"}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="size-4" />
            Add product
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4"
            encType="multipart/form-data"
          >
            <h2 className="font-semibold">
              {editProduct ? "Edit product" : "New product"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <label className="text-sm font-medium">Category *</label>
                <div className="mt-1 flex gap-1">
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    required
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value={0}>Select category</option>
                    {displayCategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(true); setShowNewBrand(false) }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent hover:bg-muted transition-colors"
                    title="Add new category"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {showNewCategory && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return
                        try {
                          const res = await adminCreateCategory({ name: newCategoryName.trim() })
                          setLocalCategories((prev) => prev ? [...prev, res.category] : [res.category])
                          setForm({ ...form, category_id: res.category.id })
                          setNewCategoryName("")
                          setShowNewCategory(false)
                          toast.success(`Category "${res.category.name}" created`)
                        } catch (err) {
                          toast.error(getApiErrorMessage(err, "Failed to create category"))
                        }
                      }}
                      className="inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewCategory(false); setNewCategoryName("") }}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Brand</label>
                <div className="mt-1 flex gap-1">
                  <select
                    value={form.brand_id}
                    onChange={(e) => setForm({ ...form, brand_id: Number(e.target.value) })}
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value={0}>No brand</option>
                    {displayBrands?.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setShowNewBrand(true); setShowNewCategory(false) }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-transparent hover:bg-muted transition-colors"
                    title="Add new brand"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {showNewBrand && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Brand name"
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newBrandName.trim()) return
                        try {
                          const res = await adminCreateBrand({ name: newBrandName.trim() })
                          setLocalBrands((prev) => prev ? [...prev, res.brand] : [res.brand])
                          setForm({ ...form, brand_id: res.brand.id })
                          setNewBrandName("")
                          setShowNewBrand(false)
                          toast.success(`Brand "${res.brand.name}" created`)
                        } catch (err) {
                          toast.error(getApiErrorMessage(err, "Failed to create brand"))
                        }
                      }}
                      className="inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewBrand(false); setNewBrandName("") }}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Thumbnail upload */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Thumbnail Image</label>
                <div className="mt-1 flex items-start gap-4">
                  {(thumbnailPreview || (editProduct?.thumbnail && !removeThumbnail)) ? (
                    <div className="relative size-24 shrink-0">
                      <img
                        src={thumbnailPreview ?? getImageUrl(editProduct?.thumbnail)}
                        alt="Thumbnail preview"
                        className="size-24 rounded-lg object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex size-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {!thumbnailPreview && !removeThumbnail && (
                    <p className="text-xs text-muted-foreground self-center">
                      Click to upload a thumbnail (JPEG, PNG, WebP, max 2MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Product images (max 5) */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">
                  Product Images ({totalImageCount}/5)
                </label>
                <div className="mt-1 flex flex-wrap gap-3">
                  {/* Existing images */}
                  {editProduct?.images?.map((img) => {
                    const isMarkedForDeletion = deleteImageIds.includes(img.id)
                    return (
                      <div key={img.id} className="relative size-24">
                        <img
                          src={getImageUrl(img.image_url)}
                          alt={`Product image ${img.sort_order + 1}`}
                          className={`size-24 rounded-lg object-cover border-2 transition-all ${
                            isMarkedForDeletion ? "border-destructive opacity-40" : "border-border"
                          }`}
                        />
                        {isMarkedForDeletion ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreImage(img.id)}
                            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white text-xs font-medium hover:bg-black/50 transition-colors"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img.id)}
                            className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* New image previews */}
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative size-24">
                      <img
                        src={preview}
                        alt={`New image ${index + 1}`}
                        className="size-24 rounded-lg object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  {/* Upload button */}
                  {remainingSlots > 0 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex size-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto size-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          +{remainingSlots} slots
                        </span>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload up to 5 images per product. JPEG, PNG, WebP (max 2MB each).
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-accent"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured product
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editProduct ? "Update product" : "Create product"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {items ? `${pagination.total} results` : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : loadError ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title={loadError}
            description="Make sure your API is running."
            action={<Button onClick={() => dispatch(fetchProducts({ search, page, per_page: 15 }))} variant="outline">Try again</Button>}
          />
        ) : !items || items.length === 0 ? (
          <StateMessage
            icon={<Package className="size-6" />}
            title="No products found"
            description={search ? "Try a different search term." : "Add your first product to get started."}
          />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Images</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(product.thumbnail || product.images?.[0]) && (
                          <img
                            src={getImageUrl(product.thumbnail || product.images?.[0]?.image_url)}
                            alt=""
                            className="size-10 rounded-md object-cover bg-muted"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.brand?.name && (
                            <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.stock > 5 ? "default" : product.stock > 0 ? "secondary" : "outline"}>
                        {product.stock > 5 ? product.stock : product.stock > 0 ? `Low: ${product.stock}` : "Out"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ImageIcon className="size-3.5" />
                        <span className="text-xs">{product.images?.length ?? 0}/5</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "default" : "outline"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(product)} disabled={updatingIds.includes(product.id)}>
                          {updatingIds.includes(product.id) ? "..." : "Edit"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={updatingIds.includes(product.id)}
                        >
                          {updatingIds.includes(product.id) ? "..." : <Trash2 className="size-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
  )
}
