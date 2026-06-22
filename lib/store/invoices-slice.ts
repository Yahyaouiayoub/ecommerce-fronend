"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Invoice } from "@/lib/types"
import type { AdminInvoiceQuery } from "@/lib/api/services"
import * as services from "@/lib/api/services"

interface InvoicesState {
  items: Invoice[]
  loading: boolean
  updatingIds: number[]
  total: number
  currentPage: number
  lastPage: number
}

const initialState: InvoicesState = {
  items: [],
  loading: false,
  updatingIds: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
}

export const fetchInvoices = createAsyncThunk(
  "invoices/fetch",
  async (params?: AdminInvoiceQuery) => {
    const res = await services.adminGetInvoices(params)
    return res
  },
)

export const updateInvoiceStatus = createAsyncThunk(
  "invoices/updateStatus",
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      const res = await services.adminUpdateInvoiceStatus(id, status)
      return res.data
    } catch (err) {
      return rejectWithValue(err)
    }
  },
)

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    optimisticStatusUpdate(state, action: PayloadAction<{ id: number; status: string }>) {
      const invoice = state.items.find((i) => i.id === action.payload.id)
      if (invoice) {
        invoice.status = action.payload.status as Invoice["status"]
      }
    },
    rollbackInvoice(state, action: PayloadAction<{ id: number; previous: Invoice }>) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = action.payload.previous
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.currentPage = action.payload.current_page
        state.lastPage = action.payload.last_page
      })
      .addCase(fetchInvoices.rejected, (state) => {
        state.loading = false
      })
      .addCase(updateInvoiceStatus.pending, (state, action) => {
        state.updatingIds.push(action.meta.arg.id)
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
        state.updatingIds = state.updatingIds.filter((id) => id !== action.payload.id)
      })
      .addCase(updateInvoiceStatus.rejected, (state, action) => {
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.id)
      })
  },
})

export const { optimisticStatusUpdate, rollbackInvoice } = invoicesSlice.actions
export default invoicesSlice.reducer
