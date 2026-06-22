"use client"

import { memo, useEffect, useRef, useState } from "react"
import { formatPrice } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  /** If true, formats as currency (e.g. $1,234.56) */
  formatCurrency?: boolean
  duration?: number
  className?: string
}

/**
 * Animated counter that smoothly transitions from the previous value to the
 * current value using requestAnimationFrame with a cubic ease-out curve.
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  formatCurrency = false,
  duration = 400,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    if (startValue === endValue) return

    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * eased
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        prevValue.current = endValue
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  const formatted = formatCurrency
    ? formatPrice(displayValue)
    : Math.round(displayValue).toLocaleString()

  return <span className={className}>{formatted}</span>
})
