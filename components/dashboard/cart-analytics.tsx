"use client"

import { ShoppingBag, Ban, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types"

interface Props {
  data: Pick<DashboardStats, "total_carts" | "active_carts" | "abandoned_carts" | "converted_carts">
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    icon: ShoppingBag,
    color: "emerald",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  abandoned: {
    label: "Abandoned",
    icon: Ban,
    color: "amber",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  converted: {
    label: "Converted",
    icon: Package,
    color: "blue",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
} as const

export function CartAnalytics({ data }: Props) {
  const total = data.total_carts || 0
  const hasData = total > 0

  const segments = [
    { key: "active" as const, value: data.active_carts },
    { key: "abandoned" as const, value: data.abandoned_carts },
    { key: "converted" as const, value: data.converted_carts },
  ]

  const getPercentage = (value: number) => (total > 0 ? ((value / total) * 100).toFixed(0) : "0")

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Cart Analytics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Active, abandoned &amp; converted carts</p>
          </div>
          <Link
            href="/dashboard/carts"
            className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No cart data yet
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Progress bar */}
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            {segments
              .filter((s) => s.value > 0)
              .map((segment) => {
                const cfg = STATUS_CONFIG[segment.key]
                const pct = getPercentage(segment.value)
                return (
                  <div
                    key={segment.key}
                    className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        segment.key === "active"
                          ? "rgb(16 185 129)"
                          : segment.key === "abandoned"
                            ? "rgb(245 158 11)"
                            : "rgb(59 130 246)",
                    }}
                  />
                )
              })}
          </div>

          {/* Stats rows */}
          <div className="space-y-2">
            {segments.map((segment) => {
              const cfg = STATUS_CONFIG[segment.key]
              const Icon = cfg.icon
              const pct = getPercentage(segment.value)
              return (
                <div
                  key={segment.key}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${cfg.bg} ${cfg.text}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <span className="font-medium">{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <span className="font-semibold">{segment.value}</span>
                </div>
              )
            })}
          </div>

          {/* Total row */}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="font-medium text-muted-foreground">Total carts</span>
            <span className="font-bold text-base">{total}</span>
          </div>
        </div>
      )}
    </div>
  )
}
