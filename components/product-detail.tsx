"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  AlertCircle,
  ChevronLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  MessageSquare,
} from "lucide-react"
import { getProduct, getProductReviews, createReview, checkReviewEligibility } from "@/lib/api/services"
import { ProductVariantSelector } from "@/components/product-variant-selector"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import { StoreImage } from "@/components/store-image"
import { useApi } from "@/lib/hooks/use-api"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn, formatPrice } from "@/lib/utils"
import { ProductDetailSkeleton } from "@/components/skeletons"
import { StateMessage } from "@/components/state-message"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { ProductImage, Review, Order, Product, ProductVariant } from "@/lib/types"
import { categoryPath, productUrlSafe } from "@/lib/product-url"
import { useAppDispatch, useAppSelector, selectIsInWishlist } from "@/lib/store"
import { addToCartAsync } from "@/lib/store/cart-slice"
import { toggleWishlistAsync } from "@/lib/store/wishlist-slice"
import { ProductCard } from "@/components/product-card"
import { toast } from "sonner"

const getValidImage = (url: string | undefined): string => getImageUrl(url)

function StarRating({ rating, interactive = false, onChange }: {
  rating: number
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`size-4 ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ProductDetail({ slug }: { slug: string }) {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { data: product, loading, error, reload } = useApi(
    () => getProduct(slug),
    [slug],
  )
  const isWishlisted = useAppSelector(selectIsInWishlist(product?.id ?? 0))
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0, rating_distribution: {} as Record<number, number> })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)

  // Load reviews
  useEffect(() => {
    const pid = product?.id
    if (!pid) return
    setReviewsLoading(true)
    getProductReviews(pid)
      .then((data) => {
        setReviews(data.reviews)
        setReviewStats({
          average_rating: data.average_rating,
          total_reviews: data.total_reviews,
          rating_distribution: data.rating_distribution,
        })
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [product?.id])

  // Load user's delivered orders for this product (to check review eligibility)
  useEffect(() => {
    const pid = product?.id
    if (!user || !pid) return
    checkReviewEligibility(pid)
      .then((res) => {
        setEligibleOrders(res.orders.map((o) => ({ id: o.id, order_number: o.order_number } as Order)))
      })
      .catch(() => {})
  }, [user, product?.id])

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
  const hasVariants = !!(resolvedProduct.variants && resolvedProduct.variants.length > 0)

  // Use variant values when a variant is selected, otherwise use parent product values
  const displayPrice = selectedVariant?.effective_price ?? resolvedProduct.price
  const displayStock = hasVariants ? (selectedVariant?.stock ?? 0) : resolvedProduct.stock
  const displaySku = selectedVariant?.sku ?? resolvedProduct.sku
  const soldOut = displayStock === 0

  const allImages = [
    resolvedProduct.thumbnail,
    ...(resolvedProduct.images?.map((img: ProductImage) => img.image_url) || [])
  ].filter((url): url is string => !!url && url.trim() !== "")

  const images = allImages.length > 0 ? allImages : ["/placeholder.svg"]

  function handleAdd() {
    dispatch(addToCartAsync({ product: resolvedProduct, quantity, variantId: selectedVariant?.id }))
      .unwrap()
      .then(() => {
        toast.success(`${resolvedProduct.name} added to cart`)
      })
      .catch(() => {
        toast.error("Could not sync with server. Try again.")
      })
  }

  function handleVariantChange(variant: ProductVariant | null) {
    setSelectedVariant(variant)
    setQuantity(1)
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrderId) {
      toast.error("Please select an order to review.")
      return
    }
    setSubmittingReview(true)
    try {
      const res = await createReview({
        product_id: product?.id ?? 0,
        order_id: selectedOrderId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      })
      setReviews((prev) => [res.review, ...prev])
      setShowReviewForm(false)
      setReviewComment("")
      setReviewRating(5)
      setSelectedOrderId(null)
      // Refresh stats
      const stats = await getProductReviews(product?.id ?? 0)
      setReviewStats({
        average_rating: stats.average_rating,
        total_reviews: stats.total_reviews,
        rating_distribution: stats.rating_distribution,
      })
      toast.success("Review submitted!")
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit review"))
    } finally {
      setSubmittingReview(false)
    }
  }

  // Already reviewed order IDs
  const reviewedOrderIds = new Set(reviews.map((r) => r.order_id))
  const availableOrders = eligibleOrders.filter((o) => !reviewedOrderIds.has(o.id))

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
            <StoreImage
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
                  <StoreImage
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
              href={categoryPath(product.category.id)}
              className="text-sm font-medium uppercase tracking-wide text-accent hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <div className="flex items-start justify-between gap-2">
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              {product.name}
            </h1>
            {/* Wishlist heart toggle */}
            {user && (
              <button
                onClick={() => {
                  dispatch(toggleWishlistAsync({ product: resolvedProduct, isWishlisted }))
                    .unwrap()
                    .then((res) => {
                      toast.success(res.action === "added" ? "Added to wishlist" : "Removed from wishlist")
                    })
                    .catch(() => {
                      toast.error("Could not update wishlist")
                    })
                }}
                className={`mt-3 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                  isWishlisted
                    ? "border-red-200 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-950/30"
                    : "border-border text-muted-foreground hover:text-red-500 hover:border-red-200"
                }`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`size-5 transition-all ${isWishlisted ? "fill-current scale-110" : ""}`} />
              </button>
            )}
          </div>

          {product.brand?.name && (
            <div className="mt-1 text-sm text-muted-foreground">
              Brand: {product.brand.name}
            </div>
          )}

          {/* Rating summary */}
          {reviewStats.total_reviews > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${
                      star <= Math.round(reviewStats.average_rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{reviewStats.average_rating}</span>
              <span className="text-sm text-muted-foreground">
                ({reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(displayPrice)}
            </span>
            {displayPrice !== product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Variant Selector */}
          {resolvedProduct && resolvedProduct.id && resolvedProduct.variants && (
            <div className={cn(hasVariants ? "mt-6" : "hidden")}>
              <ProductVariantSelector
                variants={resolvedProduct.variants}
                onVariantChange={handleVariantChange}
              />
            </div>
          )}

          <div className="mt-4">
            {soldOut ? (
              <span className="text-sm font-medium text-destructive">Out of Stock</span>
            ) : displayStock < 6 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {displayStock} left in stock
              </span>
            ) : (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                In Stock
              </span>
            )}
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {!soldOut && (
              <div className="flex items-center rounded-lg border border-border">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-l-lg disabled:opacity-30"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center hover:bg-muted/50 transition-colors rounded-r-lg disabled:opacity-30"
                  aria-label="Increase quantity"
                  disabled={quantity >= displayStock}
                  onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
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
              disabled={soldOut || (hasVariants && !selectedVariant)}
            >
              <ShoppingBag className="size-4" />
              {hasVariants && !selectedVariant ? "Select variant" : soldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {soldOut
              ? "Currently unavailable."
              : "Ships within 1-2 business days."}
          </p>

          {displaySku && (
            <p className="mt-2 text-xs text-muted-foreground">
              SKU: {displaySku}
            </p>
          )}
        </div>
      </div>

      <RelatedProducts products={product.related_products ?? []} />

      {/* Reviews Section */}
      <div className="mt-16 border-t border-border pt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Customer Reviews</h2>
            {reviewStats.total_reviews > 0 && (
              <div className="mt-2 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{reviewStats.average_rating}</span>
                  <div>
                    <StarRating rating={Math.round(reviewStats.average_rating)} />
                    <p className="text-xs text-muted-foreground">{reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.rating_distribution[star] ?? 0
                    const pct = reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right text-muted-foreground">{star}</span>
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-muted-foreground">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          {user && availableOrders.length > 0 && !showReviewForm && (
            <Button variant="outline" onClick={() => setShowReviewForm(true)}>
              <MessageSquare className="size-4" />
              Write a review
            </Button>
          )}
        </div>

        {/* Review form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Review this product</h3>
            <div>
              <label className="text-sm font-medium">Select your order</label>
              <select
                value={selectedOrderId ?? ""}
                onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                required
                className="mt-1 h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Choose an order...</option>
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.order_number} — {formatPrice(o.total_price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="mt-1">
                <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={1000}
                placeholder="Share your thoughts about this product..."
                className="mt-1 h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">{reviewComment.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submittingReview || !selectedOrderId}>
                {submittingReview ? "Submitting..." : "Submit review"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowReviewForm(false); setReviewComment(""); setReviewRating(5) }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {availableOrders.length === 0 && user && !showReviewForm && (
          <p className="mt-3 text-sm text-muted-foreground">
            {eligibleOrders.length > 0
              ? "You've already reviewed this product from your delivered orders."
              : "Review this product after you receive it in a delivered order."}
          </p>
        )}

        {/* Reviews list */}
        <div className="mt-8 space-y-6">
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="h-12 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6 last:border-0">                  <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ReviewUserAvatar user={review.user ?? null} />
                    <div>
                      <p className="text-sm font-medium">
                        {review.user?.first_name} {review.user?.last_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/** JSON-LD structured data for the product (SEO). Renders a <script> tag with Product schema. */
export function ProductDetailJsonLd({ product }: { product: Record<string, unknown> }) {
  const script = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.thumbnail || (product as any).images?.[0]?.image_url,
    sku: product.sku,
    brand: product.brand
      ? { "@type": "Brand", name: (product.brand as Record<string, unknown>).name }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: (product.stock as number) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrlSafe((product as any).slug, product.id as number),
    },
    aggregateRating: (product as any).reviews_avg_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: (product as any).reviews_avg_rating,
          reviewCount: (product as any).reviews_count,
        }
      : undefined,
  }, null, 2)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}

function ReviewUserAvatar({ user }: { user: { first_name: string; last_name: string; avatar?: string } | null }) {
  const [imgError, setImgError] = useState(false)
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "??"

  if (user?.avatar && !imgError) {
    return (
      <img
        src={getImageUrl(user.avatar)}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-medium shrink-0">
      {initials}
    </div>
  )
}

function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="text-xl font-semibold tracking-tight">Related Products</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}