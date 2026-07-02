import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import * as wishlistService from "@/lib/api/services"
import type { Product } from "@/lib/types"

export interface WishlistItemState {
  id: number
  productId: number
  product: Product
  createdAt: string
}

interface WishlistState {
  items: WishlistItemState[]
  /** Set of product IDs that are currently being toggled (optimistic) */
  togglingIds: number[]
}

const initialState: WishlistState = {
  items: [],
  togglingIds: [],
}

// ─── Async thunks ────────────────────────────────────────────────

/** Fetch the full wishlist from the server */
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async () => {
    const res = await wishlistService.getWishlist()
    return res.wishlist.map((item) => ({
      id: item.id,
      productId: item.product_id,
      product: item.product,
      createdAt: item.created_at,
    }))
  },
)

/** Add a product to the wishlist (optimistic) */
export const addToWishlistAsync = createAsyncThunk(
  "wishlist/addToWishlistAsync",
  async ({ product }: { product: Product }) => {
    const res = await wishlistService.addToWishlist(product.id)
    return {
      id: res.wishlist.id,
      productId: product.id,
      product,
      createdAt: res.wishlist.created_at,
    }
  },
)

/** Remove a product from the wishlist (optimistic) */
export const removeFromWishlistAsync = createAsyncThunk(
  "wishlist/removeFromWishlistAsync",
  async ({ productId }: { productId: number }) => {
    await wishlistService.removeFromWishlist(productId)
    return { productId }
  },
)

/** Toggle a product in the wishlist — add if not present, remove if present */
export const toggleWishlistAsync = createAsyncThunk(
  "wishlist/toggleWishlistAsync",
  async ({ product, isWishlisted }: { product: Product; isWishlisted: boolean }, { dispatch }) => {
    // Optimistic: immediately update the UI
    if (isWishlisted) {
      dispatch(wishlistSlice.actions.optimisticRemove(product.id))
    } else {
      dispatch(wishlistSlice.actions.optimisticAdd(product))
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product.id)
        return { action: "removed" as const, productId: product.id }
      } else {
        const res = await wishlistService.addToWishlist(product.id)
        return { action: "added" as const, wishlistItem: res.wishlist, product }
      }
    } catch {
      // Rollback on failure
      if (isWishlisted) {
        dispatch(wishlistSlice.actions.rollbackRemove(product))
      } else {
        dispatch(wishlistSlice.actions.rollbackAdd(product.id))
      }
      throw new Error("Failed to toggle wishlist")
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    /** Clear wishlist (on logout) */
    clearWishlist: (state) => {
      state.items = []
      state.togglingIds = []
    },
    /** Optimistic: add product to local state immediately */
    optimisticAdd: (state, action: PayloadAction<Product>) => {
      const product = action.payload
      const existing = state.items.find((i) => i.productId === product.id)
      if (!existing) {
        state.items.unshift({
          id: -Date.now(),
          productId: product.id,
          product,
          createdAt: new Date().toISOString(),
        })
      }
    },
    /** Optimistic: remove product from local state immediately */
    optimisticRemove: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.productId !== action.payload)
    },
    /** Rollback: re-add product after failed remove */
    rollbackRemove: (state, action: PayloadAction<Product>) => {
      const product = action.payload
      const existing = state.items.find((i) => i.productId === product.id)
      if (!existing) {
        state.items.unshift({
          id: -Date.now(),
          productId: product.id,
          product,
          createdAt: new Date().toISOString(),
        })
      }
    },
    /** Rollback: remove product after failed add */
    rollbackAdd: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.productId !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchWishlist ────────────────────────────────────────
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(fetchWishlist.rejected, () => {
        // Silently fail
      })
      // ── addToWishlistAsync ────────────────────────────────────
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        const { id, productId, product, createdAt } = action.payload
        const existing = state.items.find((i) => i.productId === productId)
        if (existing) {
          existing.id = id
          existing.createdAt = createdAt
        } else {
          state.items.unshift({ id, productId, product, createdAt })
        }
      })
      // ── removeFromWishlistAsync ───────────────────────────────
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.productId !== action.payload.productId)
      })
  },
})

export const { clearWishlist } = wishlistSlice.actions

export default wishlistSlice.reducer
