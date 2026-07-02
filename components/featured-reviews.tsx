"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Star, ChevronLeft, ChevronRight, Quote, ShoppingBag, BadgeCheck, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/api/client"
import { getFeaturedReviews } from "@/lib/api/services"
import { useSharedData } from "@/lib/hooks/use-api"
import type { FeaturedReview } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedReviews() {
  const { data: reviews, loading } = useSharedData<FeaturedReview[]>(
    "featuredReviews",
    getFeaturedReviews,
    5 * 60 * 1000, // 5 min stale time — reviews don't change often
  )
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const AUTOPLAY_DELAY = 5000

  const data = reviews ?? []

  const totalSlides = data.length
  const visibleCount = Math.min(totalSlides, 3)
  const showCarousel = totalSlides > 1

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || totalSlides === 0) return
      setIsTransitioning(true)
      setCurrent(index)
      setTimeout(() => setIsTransitioning(false), 500)
    },
    [isTransitioning, totalSlides],
  )

  const next = useCallback(() => {
    if (totalSlides === 0) return
    goTo((current + 1) % totalSlides)
  }, [current, totalSlides, goTo])

  const prev = useCallback(() => {
    if (totalSlides === 0) return
    goTo((current - 1 + totalSlides) % totalSlides)
  }, [current, totalSlides, goTo])

  // Autoplay
  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(next, AUTOPLAY_DELAY)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, next, totalSlides])

  // Keyboard navigation
  useEffect(() => {
    if (totalSlides === 0) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [prev, next, totalSlides])

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Skeleton className="mx-auto h-6 w-32 mb-4 rounded-full" />
          <Skeleton className="mx-auto h-9 w-64 mb-3" />
          <Skeleton className="mx-auto h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!data || data.length === 0) return null

  const review = data[current]

  // For grid layout when we have only a few reviews
  if (!showCarousel) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            Customer Reviews
          </div>
          <h2 className="text-4xl font-bold tracking-tight">What Our Customers Say</h2>
          <p className="mt-3 text-base text-muted-foreground/80 max-w-xl mx-auto">
            Real feedback from verified buyers who love our products
          </p>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3 max-w-5xl mx-auto">
          {data.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          Customer Reviews
        </div>
        <h2 className="text-4xl font-bold tracking-tight">What Our Customers Say</h2>
        <p className="mt-3 text-base text-muted-foreground/80 max-w-xl mx-auto">
          Real feedback from verified buyers who love our products
        </p>
      </div>        <div
        className="relative mx-auto max-w-5xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Viewport */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${current * (100 / visibleCount)}%)`,
              width: `${(totalSlides / visibleCount) * 100}%`,
            }}
          >
            {data.map((r) => (
              <div
                key={r.id}
                className="px-3"
                style={{ width: `${(100 / totalSlides) * visibleCount}%` }}
              >
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute -left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-md text-foreground hover:bg-accent transition-all z-10"
          aria-label="Previous review"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={next}
          className="absolute -right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-md text-foreground hover:bg-accent transition-all z-10"
          aria-label="Next review"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Bottom Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {data.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === current
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="ml-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
          >
            {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          </button>
        </div>
      </div>
    </section>
  )
}

function UserAvatar({ user, size, initials }: { user: { first_name: string; last_name: string; avatar?: string } | null | undefined; size: number; initials: string }) {
  const [imgError, setImgError] = useState(false)
  const dim = size * 4

  if (user?.avatar && !imgError) {
    return (
      <img
        src={getImageUrl(user.avatar)}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: dim, height: dim }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary"
      style={{ width: dim, height: dim }}
    >
      {initials}
    </div>
  )
}

function ReviewCard({ review }: { review: FeaturedReview }) {
  const initials = review.user
    ? `${review.user.first_name[0]}${review.user.last_name[0]}`
    : "??"

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/20 p-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-border/90">
      {/* Gradient accent bar at top */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Quote Icon */}
      <Quote className="absolute right-5 top-5 size-10 text-primary/[0.06] dark:text-primary/[0.08]" />

      {/* Rating */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, s) => (
          <Star
            key={s}
            className={cn(
              "size-[18px] transition-all duration-300",
              s < review.rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/20",
              review.rating > s && "group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]",
            )}
          />
        ))}
      </div>

      {/* Comment */}
      <div className="flex-1">
        <p className="text-sm leading-[1.7] text-foreground/80 line-clamp-4">
          <span className="text-lg leading-none text-primary/30 select-none">&ldquo;</span>
          {review.comment ?? "Great product! Highly recommended."}
          <span className="text-lg leading-none text-primary/30 select-none">&rdquo;</span>
        </p>
      </div>

      {/* User Info */}
      <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-5">
        <UserAvatar user={review.user} size={10} initials={initials} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold tracking-tight">
              {review.user
                ? `${review.user.first_name} ${review.user.last_name}`
                : "Verified Customer"}
            </span>
            {review.is_verified_purchase && (
              <BadgeCheck className="size-4 shrink-0 text-emerald-500" />
            )}
          </div>
          {review.product && (
            <Link
              href={`/products/${review.product.slug}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <ShoppingBag className="size-3 shrink-0" />
              <span className="truncate max-w-[160px]">{review.product.name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Verified Badge */}
      {review.is_verified_purchase && (
        <div className="absolute -top-2 -right-2">
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md shadow-emerald-500/20">
            <BadgeCheck className="size-3" />
            Verified
          </div>
        </div>
      )}
    </div>
  )
}
