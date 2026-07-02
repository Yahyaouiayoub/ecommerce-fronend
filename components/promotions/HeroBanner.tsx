"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/api/client"
import type { Promotion } from "@/lib/types"

interface HeroBannerProps {
  banners: Promotion[]
  autoPlayInterval?: number
}

export function HeroBanner({ banners, autoPlayInterval = 6000 }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoaded, setIsLoaded] = useState<Record<number, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const length = banners.length

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? "next" : "prev")
      setCurrent(index)
    },
    [current],
  )

  const goNext = useCallback(() => {
    setDirection("next")
    setCurrent((prev) => (prev + 1) % length)
  }, [length])

  const goPrev = useCallback(() => {
    setDirection("prev")
    setCurrent((prev) => (prev - 1 + length) % length)
  }, [length])

  // Auto-play
  useEffect(() => {
    if (isPaused || length <= 1) return

    timerRef.current = setInterval(goNext, autoPlayInterval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, length, autoPlayInterval, goNext])

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    if (length > 1) {
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }
  }, [length, goNext, goPrev])

  if (!banners.length) return null

  const banner = banners[current]

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional banners"
      aria-roledescription="carousel"
    >
      {/* Slides container */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          {banners.map((b, index) => (
            <div
              key={b.id}
              className={cn(
                "relative transition-all duration-700 ease-in-out",
                index === current
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 absolute inset-0 pointer-events-none",
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${length}`}
              aria-hidden={index !== current}
            >
              {/* Background Image */}
              {b.background_image_url ? (
                <>
                  {/* Desktop — visible from sm breakpoint and up */}
                  <div className={cn(b.mobile_image_url ? "hidden sm:block" : "block")}>
                    <img
                      src={getImageUrl(b.background_image_url)}
                      alt={b.title}
                      loading={index === 0 ? "eager" : "lazy"}
                      className={cn(
                        "h-[60vh] min-h-[420px] w-full object-cover transition-opacity duration-500",
                        isLoaded[index] ? "opacity-100" : "opacity-0",
                      )}
                      onLoad={() => setIsLoaded((prev) => ({ ...prev, [index]: true }))}
                      onError={() => setIsLoaded((prev) => ({ ...prev, [index]: true }))}
                    />
                  </div>
                  {/* Mobile — only when a dedicated mobile image is provided */}
                  {b.mobile_image_url && (
                    <div className="sm:hidden">
                      <img
                        src={getImageUrl(b.mobile_image_url)}
                        alt={b.title}
                        loading={index === 0 ? "eager" : "lazy"}
                        className={cn(
                          "h-[50vh] min-h-[360px] w-full object-cover transition-opacity duration-500",
                          isLoaded[index] ? "opacity-100" : "opacity-0",
                        )}
                        onLoad={() => setIsLoaded((prev) => ({ ...prev, [index]: true }))}
                        onError={() => setIsLoaded((prev) => ({ ...prev, [index]: true }))}
                      />
                    </div>
                  )}
                  {/* Gradient overlay — reduced opacity when image is present */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: banner.background_color
                        ? `linear-gradient(to right, ${banner.background_color}B3, ${banner.background_color}4D, transparent 60%)`
                        : "linear-gradient(to right, hsl(var(--foreground) / 0.5), hsl(var(--foreground) / 0.2), transparent 60%)",
                    }}
                  />
                </>
              ) : (
                /* Solid background color fallback */
                <div
                  className="h-[60vh] min-h-[420px] w-full"
                  style={{
                    backgroundColor: banner.background_color || "hsl(var(--muted))",
                  }}
                />
              )}

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div
                  className={cn(
                    "max-w-xl px-6 sm:px-10 lg:px-14 transition-all duration-700 delay-200",
                    index === current
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0",
                  )}
                  style={{ color: banner.text_color || undefined }}
                >
                  {/* Badge */}
                  {b.badge && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: banner.text_color
                          ? `${banner.text_color}20`
                          : "hsl(var(--background) / 0.9)",
                        color: banner.text_color || "hsl(var(--foreground))",
                      }}
                    >
                      {b.badge}
                    </span>
                  )}

                  {/* Discount text */}
                  {b.discount_text && (
                    <div
                      className="mt-2 text-sm font-semibold tracking-wide uppercase"
                      style={{
                        color: banner.text_color
                          ? `${banner.text_color}CC`
                          : "hsl(var(--background) / 0.8)",
                      }}
                    >
                      {b.discount_text}
                    </div>
                  )}

                  {/* Title */}
                  <h1
                    className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl"
                    style={{
                      color: banner.text_color
                        ? banner.text_color
                        : "hsl(var(--background))",
                    }}
                  >
                    {b.title}
                  </h1>

                  {/* Subtitle */}
                  {b.subtitle && (
                    <p
                      className="mt-2 max-w-md text-lg font-medium text-balance"
                      style={{
                        color: banner.text_color
                          ? `${banner.text_color}DD`
                          : "hsl(var(--background) / 0.9)",
                      }}
                    >
                      {b.subtitle}
                    </p>
                  )}

                  {/* Description */}
                  {b.description && (
                    <p
                      className="mt-3 max-w-md text-pretty"
                      style={{
                        color: banner.text_color
                          ? `${banner.text_color}BB`
                          : "hsl(var(--background) / 0.85)",
                      }}
                    >
                      {b.description}
                    </p>
                  )}

                  {/* CTA */}
                  {b.cta_text && b.cta_url && (
                    <div className="mt-7">
                      <Link
                        href={b.cta_url}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:gap-2"
                        style={{
                          backgroundColor: banner.text_color
                            ? banner.text_color
                            : "hsl(var(--background))",
                          color: banner.background_color
                            ? banner.background_color
                            : "hsl(var(--foreground))",
                        }}
                      >
                        {b.cta_text}
                        <ArrowRight className="size-4 transition-transform duration-200" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading shimmer */}
              {!isLoaded[index] && banner.background_image_url && (
                <div className="absolute inset-0 img-loading" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls (only show if more than 1 banner) */}
      {length > 1 && (
        <>
          {/* Arrow buttons */}
          <button
            onClick={goPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent max-sm:hidden"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent max-sm:hidden"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Bottom controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {/* Dots */}
            <div className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-1.5 backdrop-blur-sm">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={cn(
                    "rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent",
                    index === current
                      ? "size-2.5 bg-foreground scale-110"
                      : "size-2 bg-foreground/40 hover:bg-foreground/60",
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current ? "true" : undefined}
                />
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex size-7 items-center justify-center rounded-full bg-background/60 text-foreground/70 backdrop-blur-sm transition-all hover:bg-background/80 hover:text-foreground"
              aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
            >
              {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
