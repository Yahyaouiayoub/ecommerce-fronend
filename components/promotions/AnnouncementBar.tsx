"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Promotion } from "@/lib/types"

interface AnnouncementBarProps {
  announcements: Promotion[]
}

export function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())
  const [visible, setVisible] = useState(false)

  // Filter out dismissed announcements and show the first one
  const active = announcements.filter((a) => !dismissedIds.has(a.id))
  const announcement = active.length > 0 ? active[0] : null

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Load dismissed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("announcement_dismissed")
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)))
      }
    } catch {
      // ignore
    }
  }, [])

  // Rotate through announcements every 8 seconds
  useEffect(() => {
    if (active.length <= 1) return

    const interval = setInterval(() => {
      const first = active[0]
      // Move first to end
      setDismissedIds((prev) => {
        const next = new Set(prev)
        next.add(first.id)
        // Don't accumulate - clear old dismissals
        if (next.size > 20) next.clear()
        return next
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [active])

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      // Store in localStorage
      try {
        localStorage.setItem("announcement_dismissed", JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }

  if (!announcement) return null

  return (
    <div
      className={cn(
        "relative w-full transition-all duration-500 ease-in-out overflow-hidden",
        visible ? "max-h-12 opacity-100" : "max-h-0 opacity-0",
      )}
      style={{
        backgroundColor: announcement.background_color || "hsl(var(--accent))",
        color: announcement.text_color || "hsl(var(--accent-foreground))",
      }}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-2 px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        {announcement.badge && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: announcement.text_color
                ? `${announcement.text_color}25`
                : "hsl(var(--background) / 0.2)",
              color: announcement.text_color || "inherit",
            }}
          >
            {announcement.badge}
          </span>
        )}

        {/* Discount text */}
        {announcement.discount_text && (
          <span className="text-sm font-bold tracking-tight shrink-0">
            {announcement.discount_text}
          </span>
        )}

        {/* Title */}
        <span className="truncate text-sm font-medium">
          {announcement.title}
          {announcement.subtitle && (
            <span className="ml-1 text-sm opacity-80 max-sm:hidden">
              — {announcement.subtitle}
            </span>
          )}
        </span>

        {/* CTA Link */}
        {announcement.cta_text && announcement.cta_url && (
          <Link
            href={announcement.cta_url}
            className="inline-flex items-center gap-0.5 text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity shrink-0 max-sm:hidden"
          >
            {announcement.cta_text}
            <ChevronRight className="size-3.5" />
          </Link>
        )}

        {/* Close button */}
        <button
          onClick={() => handleDismiss(announcement.id)}
          className="ml-2 flex size-6 shrink-0 items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
