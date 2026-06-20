"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Expense, PaginatedResponse, ExpensePayload } from "@/lib/types"
import * as services from "@/lib/api/services"

interface ExpensesState {
  items: Expense[]
  total: number
  currentPage: number
  lastPage: number
  loading: boolean
  error: string | null
  updatingIds: number[]
}

const initialState: ExpensesState = {
  items: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  loading: false,
  error: null,
  updatingIds: [],
}

export const fetchExpenses = createAsyncThunk(
  "expenses/fetch",
  async (params: Record<string, string | number> = {}) => {
    const res = await services.adminGetExpenses(params)
    return res
  },
)

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (payload: ExpensePayload) => {
    const res = await services.adminCreateExpense(payload)
    return res.data
  },
)

export const updateExpense = createAsyncThunk(
  "expenses/update",
  async ({ id, payload }: { id: number; payload: Partial<ExpensePayload> }) => {
    const res = await services.adminUpdateExpense(id, payload)
    return res.data
  },
)

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id: number) => {
    await services.adminDeleteExpense(id)
    return id
  },
)

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload
    },
    optimisticUpdate(state, action: PayloadAction<{ id: number; changes: Partial<Expense> }>) {
      const idx = state.items.findIndex((e) => e.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.changes }
      }
    },
    optimisticRemove(state, action: PayloadAction<number>) {
      state.items = state.items.filter((e) => e.id !== action.payload)
      state.total = Math.max(0, state.total - 1)
    },
    optimisticAdd(state, action: PayloadAction<Expense>) {
      state.items.unshift(action.payload)
      state.total += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.currentPage = action.payload.current_page
        state.lastPage = action.payload.last_page
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? "Failed to load expenses"
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.total += 1
      })
      .addCase(updateExpense.pending, (state, action) => {
        state.updatingIds.push(action.meta.arg.id)
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
        state.updatingIds = state.updatingIds.filter((id) => id !== action.payload.id)
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.id)
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
      })
  },
})

export const { setPage, optimisticUpdate, optimisticRemove, optimisticAdd } = expensesSlice.actions
export default expensesSlice.reducer
