"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Product, PaginatedResponse, AdminProductPayload } from "@/lib/types"
import * as services from "@/lib/api/services"

interface ProductsState {
  items: Product[]
  total: number
  currentPage: number
  lastPage: number
  loading: boolean
  error: string | null
  updatingIds: number[]
}

const initialState: ProductsState = {
  items: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  loading: false,
  error: null,
  updatingIds: [],
}

export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async (params: Record<string, string | number> = {}) => {
    const res = await services.adminGetProducts(params)
    return res
  },
)

export const createProduct = createAsyncThunk(
  "products/create",
  async (payload: AdminProductPayload) => {
    const res = await services.adminCreateProduct(payload)
    return res.product
  },
)

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, payload }: { id: number; payload: Partial<AdminProductPayload> }) => {
    const res = await services.adminUpdateProduct(id, payload)
    return res.product
  },
)

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: number) => {
    await services.adminDeleteProduct(id)
    return id
  },
)

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload
    },
    optimisticUpdate(state, action: PayloadAction<{ id: number; changes: Partial<Product> }>) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id)
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.changes }
      }
    },
    optimisticRemove(state, action: PayloadAction<number>) {
      state.items = state.items.filter((p) => p.id !== action.payload)
      state.total = Math.max(0, state.total - 1)
    },
    optimisticAdd(state, action: PayloadAction<Product>) {
      state.items.unshift(action.payload)
      state.total += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.currentPage = action.payload.current_page
        state.lastPage = action.payload.last_page
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? "Failed to load products"
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.total += 1
      })
      .addCase(updateProduct.pending, (state, action) => {
        state.updatingIds.push(action.meta.arg.id)
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
        state.updatingIds = state.updatingIds.filter((id) => id !== action.payload.id)
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.id)
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
      })
  },
})

export const { setPage, optimisticUpdate, optimisticRemove, optimisticAdd } = productsSlice.actions
export default productsSlice.reducer
