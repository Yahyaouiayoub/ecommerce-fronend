"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { User, PaginatedResponse } from "@/lib/types"
import * as services from "@/lib/api/services"

interface UsersState {
  items: User[]
  total: number
  currentPage: number
  lastPage: number
  loading: boolean
  error: string | null
  deletingIds: number[]
}

const initialState: UsersState = {
  items: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  loading: false,
  error: null,
  deletingIds: [],
}

export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async (params: Record<string, string | number> = {}) => {
    const res = await services.adminGetUsers(params)
    return res
  },
)

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id: number) => {
    await services.adminDeleteUser(id)
    return id
  },
)

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload
    },
    optimisticRemove(state, action: PayloadAction<number>) {
      state.items = state.items.filter((u) => u.id !== action.payload)
      state.total = Math.max(0, state.total - 1)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.total = action.payload.total
        state.currentPage = action.payload.current_page
        state.lastPage = action.payload.last_page
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? "Failed to load users"
      })
      .addCase(deleteUser.pending, (state, action) => {
        state.deletingIds.push(action.meta.arg)
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
        state.deletingIds = state.deletingIds.filter((id) => id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter((id) => id !== action.meta.arg)
      })
  },
})

export const { setPage, optimisticRemove } = usersSlice.actions
export default usersSlice.reducer
