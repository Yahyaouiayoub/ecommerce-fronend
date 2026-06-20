"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { CollectionRateData } from "@/lib/types"

interface Props {
  data: CollectionRateData
}

const COLORS = {
  paid: "#22c55e",
  partial: "#f59e0b",
  unpaid: "#ef4444",
}

const LABELS: Record<string, string> = {
  paid: "Fully Paid",
  partial: "Partially Paid",
  unpaid: "Unpaid",
}

export function CollectionRateChart({ data }: Props) {
  const chartData = [
    { name: "Fully Paid", value: data.paid_count, color: COLORS.paid },
    { name: "Partially Paid", value: data.partial_count, color: COLORS.partial },
    { name: "Unpaid", value: data.unpaid_count, color: COLORS.unpaid },
  ].filter((d) => d.value > 0)

  const hasData = chartData.length > 0

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Payment Collection Rate</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Invoice payment status breakdown</p>
        </div>
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No invoice data yet
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Payment Collection Rate</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Invoice payment status breakdown</p>
      </div>
      <div className="p-5 min-w-0">
        <div className="flex items-center gap-6">
          {/* Center rate */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative flex size-28 items-center justify-center rounded-full bg-muted">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted-foreground/10" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${data.rate * 2.64} ${264 - data.rate * 2.64}`}
                />
              </svg>
              <div className="text-center">
                <p className="text-2xl font-bold">{data.rate}%</p>
                <p className="text-[10px] text-muted-foreground -mt-0.5">collected</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.paid_count} of {data.total_count} invoices
            </p>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-medium shrink-0 ml-3">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-1.5 border-t border-border">
              <span className="font-medium">Total</span>
              <span className="font-medium">{data.total_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
