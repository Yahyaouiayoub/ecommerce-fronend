import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Product } from "@/lib/types"
import * as cartService from "@/lib/api/services"

export interface CartItem {
  id: number
  /** Server-side cart item ID — set after first successful API sync */
  cartItemId?: number
  name: string
  slug: string
  price: number
  image?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const initialState: CartState = { items: [] }

// ─── Async thunks ────────────────────────────────────────────────

/** Fetch the full cart from the server (for both guests and authenticated users) */
export const fetchCartFromServer = createAsyncThunk(
  "cart/fetchCartFromServer",
  async () => {
    const res = await cartService.getCart()
    // Return items matching our local CartItem shape
    return res.cart.map((item) => ({
      id: item.product.id,
      cartItemId: item.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      image: item.product.thumbnail ?? item.product.images?.[0]?.image_url,
      quantity: item.quantity,
    }))
  },
)

/** POST /api/cart then update local state */
export const addToCartAsync = createAsyncThunk(
  "cart/addToCartAsync",
  async ({ product, quantity = 1 }: { product: Product; quantity?: number }) => {
    const res = await cartService.addToCart(product.id, quantity)
    return {
      id: product.id,
      cartItemId: res.cart.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.thumbnail ?? product.images?.[0]?.image_url,
      quantity: res.cart.quantity,
    }
  },
)

/** DELETE /api/cart/{cartItemId} then remove from local state */
export const removeFromCartAsync = createAsyncThunk(
  "cart/removeFromCartAsync",
  async ({ id, cartItemId }: { id: number; cartItemId?: number }) => {
    if (cartItemId) {
      await cartService.removeFromCart(cartItemId)
    }
    return { id }
  },
)

/** PUT /api/cart/{cartItemId} then update local state */
export const updateQuantityAsync = createAsyncThunk(
  "cart/updateQuantityAsync",
  async ({ id, cartItemId, quantity }: { id: number; cartItemId?: number; quantity: number }) => {
    const qty = Math.max(1, quantity)
    if (cartItemId) {
      await cartService.updateCartItem(cartItemId, qty)
    }
    return { id, quantity: qty }
  },
)

/** DELETE /api/cart then clear local state */
export const clearCartAsync = createAsyncThunk(
  "cart/clearCartAsync",
  async () => {
    try {
      await cartService.clearCart()
    } catch {
      // Clear local state regardless of server response
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /** Replace all cart items (used after fetching from server) */
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
    },
    /** Clear all cart items locally (used on logout) */
    clearCart: (state) => {
      state.items = []
    },
    /** Local-only fallback (no API call) */
    addToCart: (
      state,
      action: PayloadAction<{ product: Product; quantity?: number }>,
    ) => {
      const { product, quantity = 1 } = action.payload
      const existing = state.items.find((i) => i.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.thumbnail ?? product.images?.[0]?.image_url,
          quantity,
        })
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id)
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchCartFromServer ────────────────────────────────
      .addCase(fetchCartFromServer.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(fetchCartFromServer.rejected, () => {
        // Silently fail — guest users may not have a session yet
      })
      // ── addToCartAsync ──────────────────────────────────────
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        const { id, cartItemId, name, slug, price, image, quantity } =
          action.payload
        const existing = state.items.find((i) => i.id === id)
        if (existing) {
          existing.quantity = quantity
          existing.cartItemId = cartItemId
        } else {
          state.items.push({
            id,
            cartItemId,
            name,
            slug,
            price,
            image,
            quantity,
          })
        }
      })
      // ── removeFromCartAsync ─────────────────────────────────
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload.id)
      })
      // ── updateQuantityAsync ─────────────────────────────────
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        const item = state.items.find((i) => i.id === action.payload.id)
        if (item) {
          item.quantity = action.payload.quantity
        }
      })
      // ── clearCartAsync ──────────────────────────────────────
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = []
      })
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCartItems } =
  cartSlice.actions

export default cartSlice.reducer
