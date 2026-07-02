"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  CalendarClock,
  BadgeAlert,
  EyeOff,
} from "lucide-react"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import {
  adminGetPromotions,
  adminDeletePromotion,
  adminTogglePromotionActive,
  adminGetPromotionStats,
} from "@/lib/api/services"
import { useApi } from "@/lib/hooks/use-api"
import type { Promotion, PromotionStats } from "@/lib/types"
import { formatDate } from "@/lib/utils"

const POSITION_LABELS: Record<string, string> = {
  hero_banner: "Hero Banner",
  announcement_bar: "Announcement Bar",
  both: "Both",
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
]

const POSITION_OPTIONS = [
  { value: "", label: "All Positions" },
  { value: "hero_banner", label: "Hero Banner" },
  { value: "announcement_bar", label: "Announcement Bar" },
  { value: "both", label: "Both" },
]

export default function AdminPromotionsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<number | null>(null)

  const {
    data: promotionsData,
    loading,
    error,
    reload,
  } = useApi(
    () =>
      adminGetPromotions({
        search: search || undefined,
        status: statusFilter || undefined,
        position: positionFilter || undefined,
        page,
        per_page: 20,
      }),
    [search, statusFilter, positionFilter, page],
  )

  const { data: stats, reload: reloadStats } = useApi(() => adminGetPromotionStats(), [])

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this promotion?")) return
      setDeleting(id)
      try {
        await adminDeletePromotion(id)
        reload()
        reloadStats()
      } catch {
        alert("Failed to delete promotion.")
      } finally {
        setDeleting(null)
      }
    },
    [reload, reloadStats],
  )

  const handleToggleActive = useCallback(
    async (id: number) => {
      try {
        await adminTogglePromotionActive(id)
        reload()
        reloadStats()
      } catch {
        alert("Failed to toggle promotion status.")
      }
    },
    [reload, reloadStats],
  )

  // Debounce search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const promotions = promotionsData?.data ?? []
  const pagination = promotionsData
    ? {
        current_page: promotionsData.current_page,
        last_page: promotionsData.last_page,
        total: promotionsData.total,
      }
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Promotions</h1>
          <p className="mt-1 text-muted-foreground">
            Manage promotional banners and announcement bars.
          </p>
        </div>
        <Link href="/dashboard/promotions/new">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            New Promotion
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            label="Total"
            value={stats.total}
            icon={<Megaphone className="size-4" />}
            className="bg-blue-500/10 text-blue-500"
          />
          <StatsCard
            label="Active"
            value={stats.active}
            icon={<Megaphone className="size-4" />}
            className="bg-emerald-500/10 text-emerald-500"
          />
          <StatsCard
            label="Scheduled"
            value={stats.scheduled}
            icon={<CalendarClock className="size-4" />}
            className="bg-amber-500/10 text-amber-500"
          />
          <StatsCard
            label="Expired"
            value={stats.expired}
            icon={<BadgeAlert className="size-4" />}
            className="bg-red-500/10 text-red-500"
          />
          <StatsCard
            label="Disabled"
            value={stats.disabled}
            icon={<EyeOff className="size-4" />}
            className="bg-muted-foreground/10 text-muted-foreground"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search promotions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => { setPositionFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); setSearch(""); setStatusFilter(""); setPositionFilter(""); setPage(1) }}>
          Clear Filters
        </Button>
      </div>

      {/* Promotions table */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<Megaphone className="size-6" />}
            title="Failed to load promotions"
            description="Check that the API is running and try again."
          />
        ) : promotions.length === 0 ? (
          <StateMessage
            icon={<Megaphone className="size-6" />}
            title="No promotions found"
            description={
              search || statusFilter || positionFilter
                ? "Try adjusting your filters."
                : "Create your first promotion to get started."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Position</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Schedule</th>
                    <th className="px-4 py-3 text-center font-medium">Priority</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promotion) => (
                    <tr key={promotion.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/promotions/${promotion.id}`}
                          className="font-medium text-foreground hover:text-accent transition-colors"
                        >
                          {promotion.title}
                        </Link>
                        {promotion.badge && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {promotion.badge}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {POSITION_LABELS[promotion.position] || promotion.position}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={promotion.status_label} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {promotion.starts_at ? (
                          <span>
                            {formatDate(promotion.starts_at)}
                            {promotion.ends_at && (
                              <> — {formatDate(promotion.ends_at)}</>
                            )}
                          </span>
                        ) : (
                          <span className="italic">No schedule</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-xs">{promotion.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleToggleActive(promotion.id)}
                            title={promotion.is_active ? "Disable" : "Enable"}
                          >
                            {promotion.is_active ? (
                              <ToggleRight className="size-4 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="size-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Link href={`/dashboard/promotions/${promotion.id}`}>
                            <Button variant="ghost" size="icon" className="size-8" title="Edit">
                              <Pencil className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(promotion.id)}
                            disabled={deleting === promotion.id}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && <Pagination simple currentPage={page} lastPage={pagination.last_page} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  )
}

// =========================
// Sub-components
// =========================

function StatsCard({
  label,
  value,
  icon,
  className,
}: {
  label: string
  value: number
  icon: React.ReactNode
  className: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`flex size-10 items-center justify-center rounded-lg ${className}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    Active: "default",
    Scheduled: "secondary",
    Expired: "outline",
    Disabled: "destructive",
  }

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}
