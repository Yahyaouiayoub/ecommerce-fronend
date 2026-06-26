"use client"

import Link from "next/link"
import { CreditCard, ArrowRight } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { useApi } from "@/lib/hooks/use-api"
import { getPayments } from "@/lib/api/services"
import { useAuth } from "@/lib/hooks/use-auth"
import type { InvoicePayment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { data: payments, error, loading } = useApi<InvoicePayment[]>(() => getPayments(), [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/payments")
    }
  }, [authLoading, user, router])

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payment History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all your payments and their status.
        </p>

        <div className="mt-8 space-y-4">
          {loading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </>
          )}

          {!!error && !loading && (
            <StateMessage
              icon={<CreditCard className="size-6" />}
              title="Could not load payments"
              description="There was a problem fetching your payment history. Please try again later."
            />
          )}

          {!loading && !error && (!payments || payments.length === 0) && (
            <StateMessage
              icon={<CreditCard className="size-6" />}
              title="No payments yet"
              description="When you make a payment it will show up here."
              action={
                <Button asChild>
                  <Link href="/products">
                    Start shopping
                    <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              }
            />
          )}

          {!loading && !error && payments && payments.length > 0 && (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {payment.payment_type_label}
                      </p>
                      <Badge
                        variant={payment.status === "paid" ? "default" : "secondary"}
                        className="text-[10px] h-5"
                      >
                        {payment.status_label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : new Date(payment.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {payment.payment_method}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="font-semibold text-foreground">
                      {payment.amount_formatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  )
}
