"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatPrice } from "@/lib/utils"
import type { MonthData } from "@/lib/types"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

interface RevenueChartProps {
  data: MonthData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    name: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
    revenue: d.total,
  }))

  const hasData = chartData.some((d) => d.revenue > 0)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Revenue by Month</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Last 12 months — paid invoice revenue
        </p>
      </div>
      <div className="p-5 min-w-0">
        {hasData ? (
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.4} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [formatPrice(Number(value)), "Revenue"]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No revenue data yet
          </div>
        )}
      </div>
    </div>
  )
}
