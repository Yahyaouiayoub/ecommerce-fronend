"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react"
import { getProduct } from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import { useApi } from "@/lib/hooks/use-api"
import { formatPrice } from "@/lib/utils"
import { ProductDetailSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { Separator } from "@/components/ui/separator"
import type { ProductImage } from "@/lib/types"
import { useAppDispatch } from "@/lib/store"
import { addToCart } from "@/lib/store/cart-slice"
import { toast } from "sonner"

const getValidImage = (url: string | undefined): string => getImageUrl(url)

export function ProductDetail({ id }: { id: string }) {
  const dispatch = useAppDispatch()
  const productId = parseInt(id)
  const { data: product, loading, error, reload } = useApi(
    () => getProduct(productId),
    [productId],
  )
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductDetailSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <StateMessage
          icon={<AlertCircle className="size-6" />}
          title="Couldn't load this product"
          description="Connect your Laravel API at GET /products/{id} to load product details."
          action={
            <button 
              onClick={reload}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
            >
              Try again
            </button>
          }
        />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <StateMessage
          title="Product not found"
          description="This product may no longer be available."
          action={
            <Link 
              href="/products"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              Back to shop
            </Link>
          }
        />
      </div>
    )
  }

  const resolvedProduct = product
  const allImages = [
    resolvedProduct.thumbnail,
    ...(resolvedProduct.images?.map((img: ProductImage) => img.image_url) || [])
  ].filter((url): url is string => !!url && url.trim() !== "")

  const images = allImages.length > 0 ? allImages : ["/placeholder.svg"]
  const soldOut = resolvedProduct.stock === 0

  function handleAdd() {
    dispatch(addToCart({ product: resolvedProduct, quantity }))
    toast.success(`${resolvedProduct.name} added to cart`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link 
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={getValidImage(images[activeImage])}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeImage === i ? "border-accent" : "border-border"
                  }`}
                >
                  <Image
                    src={getValidImage(img)}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category?.name && (
            <Link
              href={`/products?category=${product.category.id}`}
              className="text-sm font-medium uppercase tracking-wide text-accent hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            {product.name}
          </h1>

          {product.brand && (
            <div className="mt-1 text-sm text-muted-foreground">
              Brand: {product.brand}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>

          {product.description && (
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-4">
            <span className={`text-sm font-medium ${soldOut ? "text-destructive" : "text-green-600"}`}>
              {soldOut ? "Out of Stock" : product.stock > 10 ? "In Stock" : `Only ${product.stock} left`}
            </span>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {!soldOut && (
              <div className="flex items-center rounded-lg border border-border">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-l-lg"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-r-lg"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            )}

            <button
              className={`flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                soldOut
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/80"
              }`}
              onClick={handleAdd}
              disabled={soldOut}
            >
              <ShoppingBag className="size-4" />
              {soldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {soldOut
              ? "Currently unavailable."
              : "Ships within 1-2 business days."}
          </p>

          {product.sku && (
            <p className="mt-2 text-xs text-muted-foreground">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}