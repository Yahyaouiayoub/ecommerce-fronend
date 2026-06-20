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
import type { OrdersMonthData } from "@/lib/types"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const STATUS_COLORS: Record<string, string> = {
  delivered: "#22c55e",
  shipped: "#6366f1",
  processing: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
}

interface OrdersChartProps {
  data: OrdersMonthData[]
}

export function OrdersChart({ data }: OrdersChartProps) {
  const chartData = data.map((d) => ({
    name: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
    Delivered: d.delivered,
    Shipped: d.shipped,
    Processing: d.processing,
    Pending: d.pending,
    Cancelled: d.cancelled,
  }))

  const hasData = chartData.some((d) => d.Delivered + d.Shipped + d.Processing + d.Pending + d.Cancelled > 0)

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Orders by Month</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
        </div>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No order data yet
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Orders by Month</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Last 12 months — stacked by status
        </p>
      </div>
      <div className="p-5 min-w-0">
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
                allowDecimals={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                iconType="circle"
                iconSize={8}
              />
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <Bar
                  key={status}
                  dataKey={status.charAt(0).toUpperCase() + status.slice(1)}
                  stackId="orders"
                  fill={color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
