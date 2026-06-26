"use client"

import Link from "next/link"
import { ShoppingBag, Star } from "lucide-react"
import type { Product, ProductVariant, AttributeGroup } from "@/lib/types"
import { getImageUrl } from "@/lib/api/client"
import { StoreImage } from "@/components/store-image"
import { memo, useEffect, useMemo, useState } from "react"
import { cn, formatPrice, computeAttributeGroups } from "@/lib/utils"
import { productPath } from "@/lib/product-url"
import { useAppDispatch } from "@/lib/store"
import { addToCartAsync } from "@/lib/store/cart-slice"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
  className?: string
}

export const ProductCard = memo(function ProductCard({ product, className }: ProductCardProps) {
  const dispatch = useAppDispatch()
  
  const image = getImageUrl(
    product.thumbnail || product.images?.[0]?.image_url,
  )
  const onSale = false
  const avgRating = product.reviews_avg_rating ?? 0
  const reviewCount = product.reviews_count ?? 0

  // ── Variant quick-select ──
  const hasVariants = !!(product.variants && product.variants.length > 0)
  const attributeGroups = useMemo<Record<string, AttributeGroup>>(
    () => (hasVariants ? computeAttributeGroups(product.variants!) : {}),
    [hasVariants, product.variants],
  )
  const firstVariant = useMemo<ProductVariant | null>(
    () => (hasVariants ? (product.variants!.find((v) => v.is_default) ?? product.variants![0]) : null),
    [hasVariants, product.variants],
  )

  // Track selected variant via local state (each card instance gets its own)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => firstVariant?.id ?? null,
  )

  // Sync selection when firstVariant changes (e.g. new product in list)
  useEffect(() => {
    if (firstVariant && selectedVariantId === null) {
      setSelectedVariantId(firstVariant.id)
    }
  }, [firstVariant, selectedVariantId])

  function handleVariantClick(e: React.MouseEvent, variant: ProductVariant) {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariantId(variant.id)
  }

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants || !selectedVariantId) return null
    return product.variants!.find((v) => v.id === selectedVariantId) ?? null
  }, [hasVariants, product.variants, selectedVariantId])

  const displayPrice = selectedVariant?.effective_price ?? product.price
  const displayStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock

  // Determine color values for the palette view
  const colorGroup = attributeGroups["color"]

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    dispatch(addToCartAsync({
      product,
      quantity: 1,
      variantId: selectedVariant?.id,
    }))
      .unwrap()
      .then(() => {
        toast.success(`${product.name} added to cart`)
      })
      .catch(() => {
        toast.error("Could not sync with server. Try again.")
      })
  }

  return (
    <Link
      href={productPath(product.slug)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <StoreImage
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            Sale
          </span>
        )}
        {displayStock === 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
            Sold out
          </span>
        ) : hasVariants && displayStock < 6 ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white">
            Only {displayStock} left
          </span>
        ) : !hasVariants && product.stock < 6 ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white">
            Only {product.stock} left
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-1 text-sm font-medium text-foreground">
          {product.name}
        </h3>

        {/* Rating */}
        {reviewCount > 0 ? (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-3 ${
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="size-3 fill-muted text-muted-foreground/30"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(0)</span>
          </div>
        )}

        {/* Variant quick-select */}
        {hasVariants && Object.keys(attributeGroups).length > 0 && (
          <div className="mt-2">
            {Object.entries(attributeGroups).map(([groupKey, group]) => (
              <div key={groupKey} className="flex flex-wrap items-center gap-1">
                {Object.entries(group.options).map(([optionValue, option]) => {
                  const variant = product.variants!.find((v) => v.id === option.variant_id)
                  if (!variant) return null
                  const isSelected = selectedVariant?.id === variant.id

                  // Color swatch mode
                  if (groupKey === "color") {
                    const colorMap: Record<string, string> = {
                      black: "#000000",
                      white: "#ffffff",
                      red: "#ef4444",
                      blue: "#3b82f6",
                      green: "#22c55e",
                      yellow: "#eab308",
                      purple: "#a855f7",
                      pink: "#ec4899",
                      gray: "#6b7280",
                      grey: "#6b7280",
                      "navy blue": "#1e3a5f",
                      "midnight black": "#171717",
                      "space gray": "#4b5563",
                      silver: "#d1d5db",
                      gold: "#f59e0b",
                      beige: "#f5f5dc",
                      brown: "#8b4513",
                      orange: "#f97316",
                      teal: "#14b8a6",
                      cyan: "#06b6d4",
                    }
                    const swatchColor = colorMap[optionValue.toLowerCase()] || "#cbd5e1"

                    return (
                      <button
                        key={optionValue}
                        type="button"
                        onClick={(e) => handleVariantClick(e, variant)}
                        className={cn(
                          "size-5 rounded-full border-2 transition-all",
                          isSelected
                            ? "border-accent scale-110 ring-1 ring-accent/30"
                            : "border-border hover:border-muted-foreground/50",
                          variant.stock === 0 && "opacity-30 cursor-not-allowed",
                        )}
                        style={{ backgroundColor: swatchColor }}
                        title={`${optionValue}${variant.stock === 0 ? " (sold out)" : ""}`}
                        aria-label={`Select ${optionValue}`}
                        disabled={variant.stock === 0}
                      />
                    )
                  }

                  // Size, storage or other attribute text pills
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      onClick={(e) => handleVariantClick(e, variant)}
                      disabled={variant.stock === 0}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all",
                        isSelected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30",
                        variant.stock === 0 && "opacity-30 cursor-not-allowed line-through",
                      )}
                    >
                      {optionValue}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">
              {formatPrice(displayPrice)}
            </span>
            {onSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price * 1.2)}
              </span>
            )}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            aria-label={`Add ${product.name} to cart`}
            onClick={handleAdd}
            disabled={displayStock === 0}
          >
            <ShoppingBag className="size-4" />
          </button>
        </div>
      </div>
    </Link>
  )
})