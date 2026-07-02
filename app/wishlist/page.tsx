"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Heart, ShoppingBag, Trash2, ArrowRight, AlertCircle } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { StoreImage } from "@/components/store-image"
import { useAppDispatch, useAppSelector, selectWishlistItems } from "@/lib/store"
import { removeFromWishlistAsync } from "@/lib/store/wishlist-slice"
import { addToCartAsync } from "@/lib/store/cart-slice"
import { useAuth } from "@/lib/hooks/use-auth"
import { getImageUrl } from "@/lib/api/client"
import { productPath } from "@/lib/product-url"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { toast } from "sonner"

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wishlistItems = useAppSelector(selectWishlistItems)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/wishlist")
    }
  }, [authLoading, user, router])

  function handleRemove(productId: number, name: string) {
    dispatch(removeFromWishlistAsync({ productId }))
      .unwrap()
      .then(() => toast.success(`${name} removed from wishlist`))
      .catch(() => toast.error("Could not remove from wishlist"))
  }

  function handleAddToCart(productId: number, name: string) {
    const item = wishlistItems.find((i) => i.productId === productId)
    if (!item) return
    dispatch(addToCartAsync({ product: item.product, quantity: 1 }))
      .unwrap()
      .then(() => {
        toast.success(`${name} added to cart`)
        // Optionally remove from wishlist after adding to cart
        dispatch(removeFromWishlistAsync({ productId }))
      })
      .catch(() => toast.error("Could not add to cart"))
  }

  if (authLoading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </SiteShell>
    )
  }

  if (!user) return null

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              My Wishlist
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {wishlistItems.length === 0
                ? "Save products you love for later."
                : `${wishlistItems.length} saved item${wishlistItems.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {wishlistItems.length === 0 ? (
            <StateMessage
              icon={<Heart className="size-6" />}
              title="Your wishlist is empty"
              description="Start browsing and click the heart icon to save products you love."
              action={
                <Button asChild>
                  <Link href="/products">
                    Browse products
                    <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              }
            />
          ) : (
            wishlistItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                {/* Product image */}
                <Link
                  href={productPath(item.product.slug)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <StoreImage
                    src={getImageUrl(
                      item.product.thumbnail || item.product.images?.[0]?.image_url,
                    )}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>

                {/* Product details */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={productPath(item.product.slug)}
                    className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  {item.product.category?.name && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.product.category.name}
                    </p>
                  )}
                  <p className="mt-1 font-semibold text-foreground">
                    {formatPrice(item.product.discount_price ?? item.product.price)}
                  </p>
                  {item.product.stock === 0 && (
                    <p className="mt-0.5 text-xs text-destructive">Out of stock</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddToCart(item.productId, item.product.name)}
                    disabled={item.product.stock === 0}
                    className="gap-1.5"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span className="hidden sm:inline">Add to cart</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.productId, item.product.name)}
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SiteShell>
  )
}
