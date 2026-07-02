"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  RotateCcw,
  Plus,
  Package,
  Calendar,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { getMyRefunds } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import type { Refund } from "@/lib/types"

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
}

export default function RefundsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    loadRefunds()
  }, [authLoading, user, router])

  async function loadRefunds() {
    setLoading(true)
    setError(false)
    try {
      const data = await getMyRefunds()
      setRefunds(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">My Refunds</h1>
              <p className="text-sm text-muted-foreground">
                View and track your refund requests
              </p>
            </div>
          </div>
          <Link href="/refunds/new">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              New Refund
            </Button>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<RotateCcw className="size-6" />}
            title="Failed to load refunds"
            action={<Button variant="outline" onClick={loadRefunds}>Try again</Button>}
          />
        ) : refunds.length === 0 ? (
          <StateMessage
            icon={<Package className="size-6" />}
            title="No refunds yet"
            description="You haven't requested any refunds yet. You can request a refund for any delivered order."
            action={
              <Link href="/orders">
                <Button variant="outline" className="gap-1.5">
                  View your orders
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="mt-8 space-y-3">
            {refunds.map((refund) => (
              <Link
                key={refund.id}
                href={`/refunds/${refund.id}`}
                className="block rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-sm font-semibold">
                        {refund.refund_number}
                      </h3>
                      <Badge className={statusStyles[refund.status] ?? ""}>
                        {refund.status_label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {refund.order && (
                        <span className="flex items-center gap-1">
                          <Package className="size-3.5" />
                          Order #{refund.order.order_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(refund.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(refund.refund_amount)}
                      </span>
                    </div>
                    {refund.reason && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                        Reason: {refund.reason}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/50 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
