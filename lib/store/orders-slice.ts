"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Order } from "@/lib/types"
import type { AdminOrderQuery } from "@/lib/api/services"
import * as services from "@/lib/api/services"

interface OrdersState {
  items: Order[]
  loading: boolean
  updatingIds: number[]
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  updatingIds: [],
}

export const fetchOrders = createAsyncThunk(
  "orders/fetch",
  async (params?: AdminOrderQuery) => {
    const res = await services.adminGetOrders(params)
    return res
  },
)

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      const res = await services.adminUpdateOrderStatus(id, status)
      return res.order
    } catch (err) {
      return rejectWithValue(err)
    }
  },
)

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    /** Optimistic — update UI immediately */
    optimisticStatusUpdate(state, action: PayloadAction<{ id: number; status: string }>) {
      const order = state.items.find((o) => o.id === action.payload.id)
      if (order) {
        order.status = action.payload.status as Order["status"]
      }
    },
    /** Rollback an order to its previous state */
    rollbackOrder(state, action: PayloadAction<{ id: number; previous: Order }>) {
      const idx = state.items.findIndex((o) => o.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = action.payload.previous
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchOrders.rejected, (state) => {
        state.loading = false
      })
      .addCase(updateOrderStatus.pending, (state, action) => {
        state.updatingIds.push(action.meta.arg.id)
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
        state.updatingIds = state.updatingIds.filter((id) => id !== action.payload.id)
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.id)
      })
  },
})

export const { optimisticStatusUpdate, rollbackOrder } = ordersSlice.actions
export default ordersSlice.reducer
