import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Product } from "@/lib/types"

export interface CartItem {
  id: number
  name: string
  slug: string
  price: number
  image?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const STORAGE_KEY = "cart_items"

function loadInitialState(): CartState {
  if (typeof window === "undefined") return { items: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { items: JSON.parse(raw) as CartItem[] } : { items: [] }
  } catch {
    return { items: [] }
  }
}

function persist(items: CartItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const cartSlice = createSlice({
  name: "cart",
  initialState: loadInitialState(),
  reducers: {
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
      persist(state.items)
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
      persist(state.items)
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id)
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity)
      }
      persist(state.items)
    },
    clearCart: (state) => {
      state.items = []
      persist(state.items)
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions

export default cartSlice.reducer
