import { api, getSessionId } from "./client"
import type {
  User,
  Category,
  Product,
  CartItem,
  Order,
  Payment,
  AuthResponse,
  PaginatedResponse,
  ApiResponse,
} from "@/lib/types"

// =========================
// AUTH
// =========================
export interface LoginPayload {
  email: string
  password: string
  session_id?: string
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  session_id?: string
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export async function login(payload: LoginPayload) {
  const sessionId = getSessionId()
  if (sessionId) payload.session_id = sessionId

  const { data } = await api.post<AuthResponse>("/login", payload)
  return data
}

export async function register(payload: RegisterPayload) {
  const sessionId = getSessionId()
  if (sessionId) payload.session_id = sessionId

  const { data } = await api.post<AuthResponse>("/register", payload)
  return data
}

export async function logout() {
  await api.post("/logout")
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>("/me")
  return data.user
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await api.put<{ user: User }>("/profile", payload)
  return data.user
}

// =========================
// CATEGORIES
// =========================
export async function getCategories() {
  const { data } = await api.get<Category[]>("/categories")
  return data
}

export async function getCategory(id: number) {
  const { data } = await api.get<Category>(`/categories/${id}`)
  return data
}

// =========================
// PRODUCTS
// =========================
export interface ProductQuery {
  page?: number
  per_page?: number
  category_id?: number
  search?: string
  sort?: "newest" | "price_asc" | "price_desc" | "popular"
  min_price?: number
  max_price?: number
}

export async function getProducts(params: ProductQuery = {}) {
  const { data } = await api.get<PaginatedResponse<Product>>("/products", { params })
  return data
}

export async function getProduct(id: number) {
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}

export async function getFeaturedProducts() {
  const { data } = await api.get<Product[]>("/products/featured")
  return data
}

// =========================
// CART
// =========================
export async function getCart() {
  const { data } = await api.get<{ cart: CartItem[]; session_id?: string }>("/cart")
  return data
}

export async function addToCart(product_id: number, quantity: number = 1) {
  const { data } = await api.post<{ cart: CartItem; message: string }>("/cart", {
    product_id,
    quantity,
  })
  return data
}

export async function updateCartItem(id: number, quantity: number) {
  const { data } = await api.put<{ cart: CartItem; message: string }>(`/cart/${id}`, {
    quantity,
  })
  return data
}

export async function removeFromCart(id: number) {
  const { data } = await api.delete<{ message: string }>(`/cart/${id}`)
  return data
}

export async function clearCart() {
  const { data } = await api.delete<{ message: string }>("/cart")
  return data
}

export async function mergeCart(session_id: string) {
  const { data } = await api.post<{ message: string }>("/cart/merge", { session_id })
  return data
}

// =========================
// ORDERS
// =========================
export interface CheckoutPayload {
  payment_method: string
  shipping_address: {
    full_name: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    postal_code: string
  }
  notes?: string
}

export async function createOrder(payload: CheckoutPayload) {
  const { data } = await api.post<{ message: string; order: Order }>(
    "/orders",
    payload,
  )
  return data.order
}

export async function getOrders() {
  const { data } = await api.get<Order[]>("/orders")
  return data
}

export async function getOrder(id: number) {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

// =========================
// PAYMENTS
// =========================
export async function createPayment(order_id: number, payment_method: string) {
  const { data } = await api.post<{ payment: Payment; order: Order }>("/payments", {
    order_id,
    payment_method,
  })
  return data
}

export async function getPayment(orderId: number) {
  const { data } = await api.get<Payment>(`/payments/${orderId}`)
  return data
}