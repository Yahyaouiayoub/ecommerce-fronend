"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import type { Product } from "@/lib/types"
import { getImageUrl } from "@/lib/api/client"
import { cn, formatPrice } from "@/lib/utils"
import { useAppDispatch } from "@/lib/store"
import { addToCartAsync } from "@/lib/store/cart-slice"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const dispatch = useAppDispatch()
  
  const image = getImageUrl(
    product.thumbnail || product.images?.[0]?.image_url,
  )
  const onSale = false

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    dispatch(addToCartAsync({ product, quantity: 1 }))
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
      href={`/products/${product.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
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
        {product.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
            Sold out
          </span>
        )}
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

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">
              {formatPrice(product.price)}
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
            disabled={product.stock === 0}
          >
            <ShoppingBag className="size-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}