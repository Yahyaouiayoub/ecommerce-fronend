import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import cartReducer, {
  fetchCartFromServer,
  CART_STALE_TIME,
  addToCartAsync,
  type CartItem,
} from "./cart-slice"

// Mock the cart service module
vi.mock("@/lib/api/services", () => ({
  getCart: vi.fn(),
}))

let mockServices: typeof import("@/lib/api/services")
beforeAll(async () => {
  mockServices = await import("@/lib/api/services")
})

/** Build a minimal Redux store with just the cart slice. */
function createStore(preloadedState?: { cart: { items: CartItem[]; lastFetchedAt: number | null } }) {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState,
  })
}

/** A minimal server-style cart item to satisfy getCart() response shape. */
function makeServerCartItem(overrides: Partial<{
  id: number
  productId: number
  name: string
  slug: string
  price: number
  quantity: number
  stock: number
}> = {}): Record<string, unknown> {
  const {
    id = 1,
    productId = 10,
    name = "Test Product",
    slug = "test-product",
    price = 29.99,
    quantity = 2,
    stock = 100,
  } = overrides

  return {
    id,
    product_id: productId,
    product: {
      id: productId,
      name,
      slug,
      price,
      thumbnail: null,
      images: [],
      stock,
    },
    quantity,
  }
}

// ---------------------------------------------------------------------------
// fetchCartFromServer — staleTime / force logic
// ---------------------------------------------------------------------------

describe("fetchCartFromServer staleTime logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls the API when lastFetchedAt is null (initial state)", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem()],
    })

    const store = createStore()
    await store.dispatch(fetchCartFromServer())

    expect(mockServices.getCart).toHaveBeenCalledTimes(1)
    const state = store.getState().cart
    expect(state.items).toHaveLength(1)
    expect(state.items[0].name).toBe("Test Product")
    expect(state.lastFetchedAt).not.toBeNull()
  })

  it("skips the API call when cart was fetched within staleTime", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem()],
    })

    const store = createStore({
      cart: {
        items: [],
        lastFetchedAt: Date.now(), // just fetched
      },
    })

    const result = await store.dispatch(fetchCartFromServer())

    // Should NOT call the API
    expect(mockServices.getCart).not.toHaveBeenCalled()
    // The thunk returns undefined to signal the skip
    expect(result.payload).toBeUndefined()
    // State should be unchanged
    const state = store.getState().cart
    expect(state.items).toHaveLength(0)
  })

  it("calls the API when staleTime has elapsed", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem()],
    })

    const store = createStore({
      cart: {
        items: [],
        lastFetchedAt: Date.now() - CART_STALE_TIME - 1, // just past staleTime
      },
    })

    await store.dispatch(fetchCartFromServer())

    // Should call the API because data is stale
    expect(mockServices.getCart).toHaveBeenCalledTimes(1)
    const state = store.getState().cart
    expect(state.items).toHaveLength(1)
  })

  it("calls the API with force:true even within staleTime", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem({ name: "Forced Product" })],
    })

    const store = createStore({
      cart: {
        items: [],
        lastFetchedAt: Date.now(), // just fetched — normally would skip
      },
    })

    await store.dispatch(fetchCartFromServer({ force: true }))

    // Should call the API despite recent fetch because force=true
    expect(mockServices.getCart).toHaveBeenCalledTimes(1)
    const state = store.getState().cart
    expect(state.items[0].name).toBe("Forced Product")
  })

  it("calls the API with force:true when lastFetchedAt is null", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem()],
    })

    const store = createStore() // lastFetchedAt is null

    await store.dispatch(fetchCartFromServer({ force: true }))

    expect(mockServices.getCart).toHaveBeenCalledTimes(1)
    const state = store.getState().cart
    expect(state.items).toHaveLength(1)
    expect(state.lastFetchedAt).not.toBeNull()
  })

  // -----------------------------------------------------------------------
  // Reducer behavior
  // -----------------------------------------------------------------------

  it("updates lastFetchedAt after a successful fetch", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem()],
    })

    const store = createStore()
    const before = Date.now()
    await store.dispatch(fetchCartFromServer())

    const state = store.getState().cart
    expect(state.lastFetchedAt).not.toBeNull()
    expect(state.lastFetchedAt!).toBeGreaterThanOrEqual(before)
  })

  it("does not mutate state when thunk returns undefined (skip)", async () => {
    const store = createStore({
      cart: {
        items: [{ id: 1, name: "Existing", slug: "existing", price: 10, quantity: 1 }],
        lastFetchedAt: Date.now(),
      },
    })

    const stateBefore = store.getState().cart
    await store.dispatch(fetchCartFromServer())

    // State should be identical (same reference preserved by Redux)
    const stateAfter = store.getState().cart
    expect(stateAfter.items).toEqual(stateBefore.items)
    expect(stateAfter.lastFetchedAt).toBe(stateBefore.lastFetchedAt)
  })

  it("handles rejected fetch silently (no state change)", async () => {
    vi.mocked(mockServices.getCart).mockRejectedValue(new Error("Network error"))

    const store = createStore({
      cart: {
        items: [{ id: 1, name: "Keep", slug: "keep", price: 10, quantity: 1 }],
        lastFetchedAt: null,
      },
    })

    const result = await store.dispatch(fetchCartFromServer())

    // Should have been rejected
    expect(result.meta.requestStatus).toBe("rejected")
    // State should remain unchanged
    const state = store.getState().cart
    expect(state.items).toHaveLength(1)
    expect(state.items[0].name).toBe("Keep")
    expect(state.lastFetchedAt).toBeNull()
  })

  // -----------------------------------------------------------------------
  // Cross-feature: force used in auth actions
  // -----------------------------------------------------------------------

  it("passes force:true to ensure fresh cart after login", async () => {
    vi.mocked(mockServices.getCart).mockResolvedValue({
      cart: [makeServerCartItem({ name: "Post-Login Cart" })],
    })

    const store = createStore({
      cart: {
        items: [],
        lastFetchedAt: Date.now(), // recently fetched — would be stale
      },
    })

    // Simulate what useAuth does after login
    await store.dispatch(fetchCartFromServer({ force: true }))

    expect(mockServices.getCart).toHaveBeenCalledTimes(1)
    expect(store.getState().cart.items[0].name).toBe("Post-Login Cart")
  })
})

it("CART_STALE_TIME is set to 60 seconds", () => {
  expect(CART_STALE_TIME).toBe(60_000)
})

it("addToCartAsync has the correct prefix", () => {
  expect(addToCartAsync.typePrefix).toBe("cart/addToCartAsync")
})
