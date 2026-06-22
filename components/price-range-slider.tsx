"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn, formatPrice } from "@/lib/utils"

interface PriceRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  className?: string
}

export function PriceRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = useState(value)
  const [dragging, setDragging] = useState<"min" | "max" | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Sync local value with external value (only on mount / URL param changes)
  useEffect(() => {
    setLocalValue(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value[0], value[1]])

  const getPercent = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max],
  )

  const minPercent = getPercent(localValue[0])
  const maxPercent = getPercent(localValue[1])

  function handleMouseDown(handle: "min" | "max") {
    setDragging(handle)
  }

  useEffect(() => {
    if (!dragging) return

    function handleMouseMove(e: MouseEvent) {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const rawValue = min + ratio * (max - min)
      const snappedValue = Math.round(rawValue / step) * step
      const clampedValue = Math.max(min, Math.min(max, snappedValue))

      setLocalValue((prev) => {
        if (dragging === "min") {
          const newMin = Math.min(clampedValue, prev[1] - step)
          return [newMin, prev[1]]
        } else {
          const newMax = Math.max(clampedValue, prev[0] + step)
          return [prev[0], newMax]
        }
      })
    }

    function handleMouseUp() {
      setDragging(null)
      onChange(localValue)
    }

    // Also handle touch events
    function handleTouchMove(e: TouchEvent) {
      if (!trackRef.current || !e.touches[0]) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const rawValue = min + ratio * (max - min)
      const snappedValue = Math.round(rawValue / step) * step
      const clampedValue = Math.max(min, Math.min(max, snappedValue))

      setLocalValue((prev) => {
        if (dragging === "min") {
          const newMin = Math.min(clampedValue, prev[1] - step)
          return [newMin, prev[1]]
        } else {
          const newMax = Math.max(clampedValue, prev[0] + step)
          return [prev[0], newMax]
        }
      })
    }

    function handleTouchEnd() {
      setDragging(null)
      onChange(localValue)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [dragging, min, max, step, onChange, localValue])

  const isDragging = dragging !== null

  return (
    <div className={cn("space-y-3", className)}>
      {/* Labels */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {formatPrice(localValue[0])}
        </span>
        <span className="text-xs text-muted-foreground">—</span>
        <span className="font-medium text-foreground">
          {formatPrice(localValue[1])}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-6 cursor-pointer select-none touch-none",
          "flex items-center",
        )}
        onMouseDown={(e) => {
          // Click on track — move nearest handle
          if (!trackRef.current) return
          const rect = trackRef.current.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width
          const clickValue = min + x * (max - min)
          const distMin = Math.abs(clickValue - localValue[0])
          const distMax = Math.abs(clickValue - localValue[1])
          handleMouseDown(distMin <= distMax ? "min" : "max")
        }}
      >
        {/* Background track */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-muted" />

        {/* Active range */}
        <div
          className="absolute h-1.5 rounded-full bg-foreground/70 transition-[left,right] duration-75"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min handle */}
        <div
          className={cn(
            "absolute z-10 size-4 -translate-x-1/2 rounded-full border-2",
            "bg-background border-foreground",
            "transition-shadow",
            isDragging && dragging === "min" && "shadow-md ring-3 ring-foreground/20",
            "hover:shadow-md",
          )}
          style={{ left: `${minPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown("min")
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            handleMouseDown("min")
          }}
        >
          <div className="absolute inset-1 rounded-full bg-foreground/80" />
        </div>

        {/* Max handle */}
        <div
          className={cn(
            "absolute z-10 size-4 -translate-x-1/2 rounded-full border-2",
            "bg-background border-foreground",
            "transition-shadow",
            isDragging && dragging === "max" && "shadow-md ring-3 ring-foreground/20",
            "hover:shadow-md",
          )}
          style={{ left: `${maxPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleMouseDown("max")
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            handleMouseDown("max")
          }}
        >
          <div className="absolute inset-1 rounded-full bg-foreground/80" />
        </div>
      </div>
    </div>
  )
}
