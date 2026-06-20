"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatPrice } from "@/lib/utils"
import type { RevenueVsExpenseData } from "@/lib/types"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

interface Props {
  data: RevenueVsExpenseData[]
}

export function RevenueVsExpensesChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
    Revenue: d.revenue,
    Expenses: d.expenses,
  }))

  const hasData = chartData.some((d) => d.Revenue > 0 || d.Expenses > 0)

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Revenue vs Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
        </div>
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No financial data yet
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Revenue vs Expenses</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
      </div>
      <div className="p-5 min-w-0">
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => formatPrice(Number(value))}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
              <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
