"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  LayoutGrid,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import {
  adminGetHomepageFeatures,
  adminDeleteHomepageFeature,
  adminToggleHomepageFeatureActive,
  adminReorderHomepageFeatures,
} from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import { getIconByKey } from "@/lib/icon-map"
import type { FeatureCard } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function AdminHomepageFeaturesPage() {
  const { data: featuresData, loading, error, reload } = useApi(
    () => adminGetHomepageFeatures(),
    [],
  )

  const features = featuresData?.data ?? []
  const [deleting, setDeleting] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this feature card?")) return
      setDeleting(id)
      try {
        await adminDeleteHomepageFeature(id)
        reload()
      } catch {
        alert("Failed to delete feature card.")
      } finally {
        setDeleting(null)
      }
    },
    [reload],
  )

  const handleToggleActive = useCallback(
    async (id: number) => {
      try {
        await adminToggleHomepageFeatureActive(id)
        reload()
      } catch {
        alert("Failed to toggle feature card status.")
      }
    },
    [reload],
  )

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) return
      const items = [...features]
      ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
      await saveReorder(items)
    },
    [features],
  )

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index === features.length - 1) return
      const items = [...features]
      ;[items[index], items[index + 1]] = [items[index + 1], items[index]]
      await saveReorder(items)
    },
    [features],
  )

  const saveReorder = async (items: FeatureCard[]) => {
    setSavingOrder(true)
    try {
      await adminReorderHomepageFeatures(
        items.map((item, i) => ({ id: item.id, sort_order: i * 10 })),
      )
      reload()
    } catch {
      alert("Failed to reorder feature cards.")
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Homepage Features</h1>
          <p className="mt-1 text-muted-foreground">
            Manage the feature cards displayed on the homepage.
          </p>
        </div>
        <Link href="/dashboard/homepage-features/new">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            New Feature Card
          </Button>
        </Link>
      </div>

      {/* Features list */}
      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<LayoutGrid className="size-6" />}
            title="Failed to load feature cards"
            description="Check that the API is running and try again."
          />
        ) : features.length === 0 ? (
          <StateMessage
            icon={<LayoutGrid className="size-6" />}
            title="No feature cards yet"
            description="Create your first feature card to display it on the homepage."
          />
        ) : (
          <>
            {/* Reorder hint */}
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowUpDown className="size-3.5" />
              Use the arrow buttons to reorder cards. Cards display from top to bottom on the homepage.
              {savingOrder && <span className="text-accent ml-2">Saving order...</span>}
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => {
                const IconComponent = getIconByKey(feature.icon_key)
                return (
                  <div
                    key={feature.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
                      !feature.is_active && "opacity-60",
                    )}
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || savingOrder}
                        className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Move up"
                      >
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 5L5 1L9 5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === features.length - 1 || savingOrder}
                        className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Move down"
                      >
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 1L5 5L9 1" />
                        </svg>
                      </button>
                    </div>

                    {/* Icon */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      {IconComponent ? (
                        <IconComponent className="size-5" />
                      ) : (
                        <span className="text-lg font-bold">•</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {feature.title}
                        </span>
                        <Badge variant={feature.is_active ? "default" : "secondary"} className="text-[10px]">
                          {feature.is_active ? "Active" : "Disabled"}
                        </Badge>
                        <span className="text-xs text-muted-foreground shrink-0 font-mono">
                          #{feature.sort_order}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                          {feature.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleToggleActive(feature.id)}
                        title={feature.is_active ? "Disable" : "Enable"}
                      >
                        {feature.is_active ? (
                          <ToggleRight className="size-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Link href={`/dashboard/homepage-features/${feature.id}`}>
                        <Button variant="ghost" size="icon" className="size-8" title="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(feature.id)}
                        disabled={deleting === feature.id}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
