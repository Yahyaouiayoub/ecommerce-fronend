import { api, getSessionId } from "./client"
import type {
  User,
  Brand,
  Category,
  Product,
  CartItem,
  Order,
  Payment,
  Invoice,
  InvoicePayment,
  InvoicePaymentOptions,
  OrderPaymentSummary,
  Expense,
  ExpenseMonthData,
  ExpenseCategoryData,
  ExpensePayload,
  FinancialDashboardData,
  AuthResponse,
  DashboardStats,
  AdminProductPayload,
  AdminBrandPayload,
  AdminCategoryPayload,
  AdminUserPayload,
  UserSummary,
  PaginatedResponse,
  Address,
  Review,
  ProductReviewsResponse,
  CreateReviewPayload,
  AdminCart,
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
// BRANDS
// =========================
export async function getBrands() {
  const { data } = await api.get<Brand[]>("/brands")
  return data
}

// =========================
// ADMIN: BRANDS
// =========================
export async function adminGetBrands() {
  const { data } = await api.get<Brand[]>("/admin/brands")
  return data
}

export async function adminCreateBrand(payload: AdminBrandPayload) {
  const { data } = await api.post<{ message: string; brand: Brand }>("/admin/brands", payload)
  return data
}

/** Create brand with image via multipart/form-data */
export async function adminCreateBrandMultipart(formData: FormData) {
  const { data } = await api.post<{ message: string; brand: Brand }>("/admin/brands", formData)
  return data
}

export async function adminUpdateBrand(id: number, payload: Partial<AdminBrandPayload>) {
  const { data } = await api.put<{ message: string; brand: Brand }>(`/admin/brands/${id}`, payload)
  return data
}

/** Update brand with image via multipart/form-data */
export async function adminUpdateBrandMultipart(id: number, formData: FormData) {
  formData.append('_method', 'PUT')
  const { data } = await api.post<{ message: string; brand: Brand }>(`/admin/brands/${id}`, formData)
  return data
}

export async function adminDeleteBrand(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/brands/${id}`)
  return data
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
// ADDRESSES
// =========================
export async function getAddresses() {
  const { data } = await api.get<Address[]>("/addresses")
  return data
}

export interface CreateAddressPayload {
  full_name: string
  email?: string
  phone?: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  label?: string
  is_default?: boolean
}

export async function createAddress(payload: CreateAddressPayload) {
  const { data } = await api.post<{ message: string; address: Address }>("/addresses", payload)
  return data
}

export async function updateAddress(id: number, payload: Partial<CreateAddressPayload>) {
  const { data } = await api.put<{ message: string; address: Address }>(`/addresses/${id}`, payload)
  return data
}

export async function deleteAddress(id: number) {
  const { data } = await api.delete<{ message: string }>(`/addresses/${id}`)
  return data
}

export async function setDefaultAddress(id: number) {
  const { data } = await api.put<{ message: string; address: Address }>(`/addresses/${id}/default`)
  return data
}

// =========================
// ORDERS
// =========================
export interface CheckoutPayload {
  payment_method: string
  address_id?: number
  notes?: string
  // Guest checkout fields
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
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

// =========================
// ADMIN: DASHBOARD
// =========================

export async function getDashboardStats() {
  const { data } = await api.get<DashboardStats>("/admin/dashboard/stats")
  return data
}

export async function getFinancialDashboard() {
  const { data } = await api.get<FinancialDashboardData>("/admin/dashboard/financial")
  return data
}

// =========================
// ADMIN: PRODUCTS
// =========================

export async function adminGetProducts(params: Record<string, string | number> = {}) {
  const { data } = await api.get<PaginatedResponse<Product>>("/admin/products", { params })
  return data
}

export async function adminCreateProduct(payload: AdminProductPayload) {
  const { data } = await api.post<{ message: string; product: Product }>("/admin/products", payload)
  return data
}

/** Upload product with images via multipart/form-data */
export async function adminCreateProductMultipart(formData: FormData) {
  const { data } = await api.post<{ message: string; product: Product }>("/admin/products", formData)
  return data
}

export async function adminUpdateProduct(id: number, payload: Partial<AdminProductPayload>) {
  const { data } = await api.put<{ message: string; product: Product }>(`/admin/products/${id}`, payload)
  return data
}

/** Update product with images via multipart/form-data */
export async function adminUpdateProductMultipart(id: number, formData: FormData) {
  // Laravel requires _method=PUT for multipart PUT requests
  formData.append('_method', 'PUT')
  const { data } = await api.post<{ message: string; product: Product }>(`/admin/products/${id}`, formData)
  return data
}

export async function adminDeleteProduct(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/products/${id}`)
  return data
}

export async function adminDeleteProductImage(productId: number, imageId: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/products/${productId}/images/${imageId}`)
  return data
}

// =========================
// ADMIN: CATEGORIES
// =========================

export async function adminGetCategories(params: Record<string, string | number> = {}) {
  const { data } = await api.get<Category[]>("/admin/categories", { params })
  return data
}

export async function adminCreateCategory(payload: AdminCategoryPayload) {
  const { data } = await api.post<{ message: string; category: Category }>("/admin/categories", payload)
  return data
}

/** Create category with image via multipart/form-data */
export async function adminCreateCategoryMultipart(formData: FormData) {
  const { data } = await api.post<{ message: string; category: Category }>("/admin/categories", formData)
  return data
}

export async function adminUpdateCategory(id: number, payload: Partial<AdminCategoryPayload>) {
  const { data } = await api.put<{ message: string; category: Category }>(`/admin/categories/${id}`, payload)
  return data
}

/** Update category with image via multipart/form-data */
export async function adminUpdateCategoryMultipart(id: number, formData: FormData) {
  formData.append('_method', 'PUT')
  const { data } = await api.post<{ message: string; category: Category }>(`/admin/categories/${id}`, formData)
  return data
}

export async function adminDeleteCategory(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/categories/${id}`)
  return data
}

// =========================
// ADMIN: ORDERS
// =========================

export interface AdminOrderQuery {
  status?: string
  search?: string
  date_from?: string
  date_to?: string
}

export async function adminGetOrders(params?: AdminOrderQuery) {
  const { data } = await api.get<Order[]>("/admin/orders", { params })
  return data
}

export async function adminUpdateOrderStatus(id: number, status: string) {
  const { data } = await api.put<{ message: string; order: Order }>(`/admin/orders/${id}/status`, { status })
  return data
}

// =========================
// ADMIN: INVOICES & PAYMENTS
// =========================

export async function adminGetOrderDetail(orderId: number) {
  const { data } = await api.get<Order>(`/admin/orders/${orderId}`)
  return data
}

export async function adminGetInvoicePaymentOptions(invoiceId: number) {
  const { data } = await api.get<InvoicePaymentOptions>(`/admin/invoices/${invoiceId}/payment-options`)
  return data
}

export async function adminRecordPayment(invoiceId: number, paymentType: string, amount?: number) {
  const { data } = await api.post<{ message: string; data: { payment: InvoicePayment; invoice: Invoice } }>(
    "/admin/payments",
    { invoice_id: invoiceId, payment_type: paymentType, amount },
  )
  return data
}

export async function adminGetOrderPaymentSummary(orderId: number) {
  const { data } = await api.get<OrderPaymentSummary>(`/admin/orders/${orderId}/payment-summary`)
  return data
}

// =========================
// ADMIN: EXPENSES
// =========================

export interface AdminExpenseQuery {
  category?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function adminGetExpenses(params: AdminExpenseQuery = {}) {
  const { data } = await api.get<PaginatedResponse<Expense>>("/admin/expenses", { params })
  return data
}

export async function adminCreateExpense(payload: ExpensePayload) {
  const { data } = await api.post<{ message: string; data: Expense }>("/admin/expenses", payload)
  return data
}

export async function adminUpdateExpense(id: number, payload: Partial<ExpensePayload>) {
  const { data } = await api.put<{ message: string; data: Expense }>(`/admin/expenses/${id}`, payload)
  return data
}

export async function adminDeleteExpense(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/expenses/${id}`)
  return data
}

export async function adminGetExpenseMonthlyReport(months: number = 12) {
  const { data } = await api.get<{ data: ExpenseMonthData[]; totals: { total: number; count: number; average_per_month: number } }>(
    "/admin/expenses/reports/monthly", { params: { months } },
  )
  return data
}

export async function adminGetExpenseYearlyReport(years: number = 5) {
  const { data } = await api.get<{ data: { year: number; total: number; count: number; average: number }[] }>(
    "/admin/expenses/reports/yearly", { params: { years } },
  )
  return data
}

export async function adminGetExpenseCategoryReport(year?: number, month?: number) {
  const { data } = await api.get<{ data: ExpenseCategoryData[]; grand_total: number }>(
    "/admin/expenses/reports/by-category", { params: { year, month } },
  )
  return data
}

export async function adminGetExpenseCategories() {
  const { data } = await api.get<{ data: string[] }>("/admin/expenses/categories")
  return data.data
}

// =========================
// REVIEWS
// =========================

export async function getProductReviews(productId: number) {
  const { data } = await api.get<ProductReviewsResponse>(`/products/${productId}/reviews`)
  return data
}

export async function createReview(payload: CreateReviewPayload) {
  const { data } = await api.post<{ message: string; review: Review }>("/reviews", payload)
  return data
}

// =========================
// ADMIN: CARTS
// =========================

export async function adminGetCarts(params?: Record<string, string>) {
  const { data } = await api.get<AdminCart[]>("/admin/carts", { params })
  return data
}

export async function adminGetCartDetail(ownerKey: string) {
  const { data } = await api.get<AdminCart>(`/admin/carts/${ownerKey}`)
  return data
}

export async function adminMarkCartAbandoned(ownerKey: string, notify?: boolean) {
  const { data } = await api.put<{ message: string }>(`/admin/carts/${ownerKey}/abandon`, null, {
    params: notify ? { notify: true } : undefined,
  })
  return data
}

export async function adminDeleteCart(ownerKey: string) {
  const { data } = await api.delete<{ message: string }>(`/admin/carts/${ownerKey}`)
  return data
}

export async function adminConvertCartToUser(ownerKey: string, userId: number) {
  const { data } = await api.post<{ message: string; cart: AdminCart }>(`/admin/carts/${ownerKey}/convert`, { user_id: userId })
  return data
}

// =========================
// ADMIN: USERS
// =========================

export async function adminGetUsers(params: Record<string, string | number> = {}) {
  const { data } = await api.get<PaginatedResponse<User>>("/admin/users", { params })
  return data
}

export async function adminGetUser(id: number) {
  const { data } = await api.get<User>(`/admin/users/${id}`)
  return data
}

export async function adminCreateUser(payload: AdminUserPayload) {
  const { data } = await api.post<{ message: string; user: User }>("/admin/users", payload)
  return data
}

export async function adminUpdateUser(id: number, payload: Partial<AdminUserPayload>) {
  const { data } = await api.put<{ message: string; user: User }>(`/admin/users/${id}`, payload)
  return data
}

export async function adminDeleteUser(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/users/${id}`)
  return data
}

export async function adminGetUserSummary() {
  const { data } = await api.get<UserSummary>("/admin/users/summary")
  return data
}