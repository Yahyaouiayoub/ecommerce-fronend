"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
  TrendingDown,
  PieChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import {
  adminGetExpenseMonthlyReport,
  adminGetExpenseCategoryReport,
  adminGetExpenseCategories,
} from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api/client"
import { useAppDispatch, useAppSelector, selectExpenses, selectExpensesLoading, selectExpensesError, selectExpensesPagination, selectExpensesUpdating } from "@/lib/store"
import { fetchExpenses, createExpense, updateExpense, deleteExpense, optimisticRemove } from "@/lib/store/expenses-slice"
import type { Expense, PaginatedResponse, ExpenseMonthData, ExpenseCategoryData, ExpensePayload } from "@/lib/types"
import { toast } from "sonner"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export default function AdminExpensesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectExpenses)
  const loading = useAppSelector(selectExpensesLoading)
  const loadError = useAppSelector(selectExpensesError)
  const pagination = useAppSelector(selectExpensesPagination)
  const updatingIds = useAppSelector(selectExpensesUpdating)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)

  // Load expenses when filters/page change
  useEffect(() => {
    dispatch(fetchExpenses({ category: categoryFilter, search, date_from: dateFrom, date_to: dateTo, page, per_page: 15 }))
  }, [dispatch, categoryFilter, search, dateFrom, dateTo, page])

  // Monthly report
  const { data: monthlyReport } = useApi<{ data: ExpenseMonthData[]; totals: { total: number; count: number; average_per_month: number } } | null>(
    () => adminGetExpenseMonthlyReport(12),
    [],
  )

  // Category report
  const { data: categoryReport } = useApi<{ data: ExpenseCategoryData[]; grand_total: number } | null>(
    () => adminGetExpenseCategoryReport(),
    [],
  )

  // Pre-defined categories
  const { data: expenseCategories } = useApi<string[] | null>(
    () => adminGetExpenseCategories(),
    [],
  )

  // Form state
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  const clearFilters = () => {
    setCategoryFilter("")
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }
  const hasFilters = categoryFilter || search || dateFrom || dateTo

  const resetForm = () => {
    setForm({ title: "", amount: "", category: "", description: "", expense_date: new Date().toISOString().split("T")[0] })
    setEditExpense(null)
    setShowForm(false)
  }

  const openEdit = (expense: Expense) => {
    setEditExpense(expense)
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category ?? "",
      description: expense.description ?? "",
      expense_date: expense.expense_date,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload: ExpensePayload = {
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category || undefined,
      description: form.description || undefined,
      expense_date: form.expense_date,
    }
    try {
      if (editExpense) {
        await dispatch(updateExpense({ id: editExpense.id, payload })).unwrap()
        toast.success("Expense updated")
      } else {
        await dispatch(createExpense(payload)).unwrap()
        toast.success("Expense created")
      }
      resetForm()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save expense"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    // Optimistic remove
    dispatch(optimisticRemove(id))
    try {
      await dispatch(deleteExpense(id)).unwrap()
      toast.success("Expense deleted")
    } catch (err) {
      // Reload on error to restore state
      dispatch(fetchExpenses({ category: categoryFilter, search, date_from: dateFrom, date_to: dateTo, page, per_page: 15 }))
      toast.error(getApiErrorMessage(err, "Failed to delete expense"))
    }
  }

  // Chart colors
  const chartColors = [
    "bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
    "bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-lime-500",
    "bg-orange-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500",
  ]

  if (authLoading) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items ? `${pagination.total} expenses · ${formatPrice(monthlyReport?.totals.total ?? 0)} total` : "Track your business expenses"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="size-4" />
              Filters
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="size-4" />
              Add expense
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
            <p className="mt-1 text-xl font-bold">{formatPrice(monthlyReport?.totals.total ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="mt-1 text-xl font-bold">
              {formatPrice(monthlyReport?.data?.length ? monthlyReport.data[monthlyReport.data.length - 1]?.total ?? 0 : 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Average</p>
            <p className="mt-1 text-xl font-bold">{formatPrice(monthlyReport?.totals.average_per_month ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Entries</p>
            <p className="mt-1 text-xl font-bold">{monthlyReport?.totals.count ?? 0}</p>
          </div>
        </div>

        {/* Reports row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Monthly trend */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <TrendingDown className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Monthly Expenses</h3>
            </div>
            <div className="p-5">
              {monthlyReport?.data ? (
                <div className="space-y-2">
                  {[...monthlyReport.data].reverse().map((item) => {
                    const maxTotal = Math.max(...monthlyReport.data.map((d) => d.total), 1)
                    const barWidth = (item.total / maxTotal) * 100
                    return (
                      <div key={`${item.year}-${item.month}`} className="flex items-center gap-3 text-sm">
                        <span className="w-20 shrink-0 text-muted-foreground">
                          {MONTH_NAMES[item.month - 1]} {item.year}
                        </span>
                        <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-md bg-red-500/70 dark:bg-red-500/50 transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-medium shrink-0">
                          {formatPrice(item.total)}
                        </span>
                        <span className="w-8 text-right text-xs text-muted-foreground shrink-0">
                          {item.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No expense data yet
                </div>
              )}
            </div>
          </div>

          {/* By category */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <PieChart className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Expenses by Category</h3>
            </div>
            <div className="p-5">
              {categoryReport?.data && categoryReport.data.length > 0 ? (
                <div className="space-y-3">
                  {categoryReport.data.slice(0, 8).map((item, idx) => (
                    <div key={item.category} className="flex items-center gap-3 text-sm">
                      <div className={`size-3 shrink-0 rounded-full ${chartColors[idx % chartColors.length]}`} />
                      <span className="flex-1 truncate">{item.category_label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-32">
                        <div
                          className={`h-full rounded-full ${chartColors[idx % chartColors.length]}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-20 text-right font-medium shrink-0">{formatPrice(item.total)}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground shrink-0">{item.percentage}%</span>
                    </div>
                  ))}
                  {categoryReport.data.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{categoryReport.data.length - 8} more categories
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No category data yet
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold">{editExpense ? "Edit expense" : "New expense"}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select category</option>
                  {expenseCategories?.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editExpense ? "Update expense" : "Create expense"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        )}

        {/* Filter bar */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-32 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All categories</option>
                  {expenseCategories?.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-40 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-36" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-36" />
              </div>
              {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="size-3.5" /> Clear</Button>}
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : loadError ? (
          <StateMessage icon={<AlertCircle className="size-6" />} title={loadError} action={<Button onClick={() => dispatch(fetchExpenses({ category: categoryFilter, search, date_from: dateFrom, date_to: dateTo, page, per_page: 15 }))} variant="outline">Try again</Button>} />
        ) : !items || items.length === 0 ? (
          <StateMessage
            icon={<Banknote className="size-6" />}
            title={hasFilters ? "No expenses match your filters" : "No expenses yet"}
            description={hasFilters ? "Try adjusting your filters." : "Add your first expense to start tracking."}
            action={hasFilters ? <Button onClick={clearFilters} variant="outline">Clear filters</Button> : <Button onClick={() => { resetForm(); setShowForm(true) }}>Add expense</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-8 px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Created by</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((expense, idx) => (
                    <tr key={expense.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(page - 1) * 15 + idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{expense.title}</p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-60">{expense.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {expense.category ? (
                          <Badge variant="outline">{expense.category_label ?? expense.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                        -{expense.amount_formatted}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {expense.expense_date ? new Date(expense.expense_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {expense.creator?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => openEdit(expense)} disabled={updatingIds.includes(expense.id)}>
                            {updatingIds.includes(expense.id) ? "..." : "Edit"}
                          </Button>
                          <Button variant="ghost" size="xs" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id, expense.title)} disabled={updatingIds.includes(expense.id)}>
                            {updatingIds.includes(expense.id) ? "..." : <Trash2 className="size-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {pagination.currentPage} of {pagination.lastPage}</span>
                <Button variant="outline" size="sm" disabled={page >= pagination.lastPage} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
  )
}
