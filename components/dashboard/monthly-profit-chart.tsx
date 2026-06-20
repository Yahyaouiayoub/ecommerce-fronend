"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatPrice } from "@/lib/utils"
import type { MonthlyProfitData } from "@/lib/types"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

interface Props {
  data: MonthlyProfitData[]
}

export function MonthlyProfitChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
    Profit: d.profit,
  }))

  const hasData = chartData.some((d) => d.Profit !== 0)

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Monthly Profit</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue minus expenses</p>
        </div>
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No profit data yet
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Monthly Profit</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Revenue minus expenses</p>
      </div>
      <div className="p-5 min-w-0">
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
              <ReferenceLine y={0} className="stroke-border" strokeOpacity={0.6} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [formatPrice(Number(value)), "Profit"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Bar
                dataKey="Profit"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                fill="var(--accent)"
                // Color profit positive/negative via CSS trick
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
