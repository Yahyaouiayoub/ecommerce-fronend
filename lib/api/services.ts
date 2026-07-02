import { api, getSessionId } from "./client"
import type {
  User,
  Brand,
  Category,
  Product,
  ProductReferences,
  ProductVariant,
  AttributeGroup,
  CartItem,
  Order,
  Payment,
  Invoice,
  InvoicePayment,
  InvoicePaymentOptions,
  OrderPaymentSummary,
  InvoiceStats,
  InvoiceDetailResponse,
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
  FeaturedReview,
  FeaturedReviewStats,
  FeaturedReviewProduct,
  ReviewModerationStats,
  AdminCart,
  PublicSettings,
  AdminSettingsResponse,
  ShippingMethod,
  WishlistItem,
  Coupon,
  CouponStats,
  CouponCheckResult,
  Refund,
  RefundableItemsResponse,
  RefundDashboardStats,
  Promotion,
  PromotionStats,
  ActivePromotionsResponse,
  FeatureCard,
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

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.put<{ message: string }>("/profile/password", payload)
  return data
}

// =========================
// PASSWORD RESET
// =========================

export interface ForgotPasswordPayload {
  email: string
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const { data } = await api.post<{ message: string }>("/forgot-password", payload)
  return data
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await api.post<{ message: string }>("/reset-password", payload)
  return data
}

// =========================
// EMAIL VERIFICATION
// =========================

export async function resendVerificationEmail() {
  const { data } = await api.post<{ message: string }>("/email/resend")
  return data
}

export async function getVerificationStatus() {
  const { data } = await api.get<{ verified: boolean; email_verified_at?: string }>("/email/status")
  return data
}

// =========================
// SESSION MANAGEMENT
// =========================

export interface Session {
  id: number
  name: string
  is_current: boolean
  created_at: string
  last_used_at?: string
}

export async function getSessions() {
  const { data } = await api.get<{ sessions: Session[] }>("/sessions")
  return data.sessions
}

export async function revokeSession(id: number) {
  const { data } = await api.delete<{ message: string }>(`/sessions/${id}`)
  return data
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
  brand_id?: number
  search?: string
  sort?: "newest" | "price_asc" | "price_desc" | "popular"
  min_price?: number
  max_price?: number
  new_arrivals?: boolean
  best_sellers?: boolean
}

export async function getProducts(params: ProductQuery = {}) {
  const { data } = await api.get<PaginatedResponse<Product>>("/products", { params })
  return data
}

export async function getProduct(id: number | string) {
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}

// =========================
// TWO-FACTOR AUTHENTICATION
// =========================

export interface TwoFactorSetup {
  enabled: boolean
  secret?: string
  qr_code_url?: string
  recovery_codes?: string[]
}

export interface TwoFactorStatus {
  enabled: boolean
  message?: string
}

export async function getTwoFactorStatus() {
  const { data } = await api.get<TwoFactorStatus>("/2fa/status")
  return data
}

export async function enableTwoFactor() {
  const { data } = await api.post<TwoFactorSetup>("/2fa/enable")
  return data
}

export async function confirmTwoFactor(code: string) {
  const { data } = await api.post<{
    message: string
    recovery_codes: string[]
  }>("/2fa/confirm", { code })
  return data
}

export async function disableTwoFactor(current_password: string) {
  const { data } = await api.post<{ message: string }>("/2fa/disable", { current_password })
  return data
}

export async function regenerateRecoveryCodes(current_password: string) {
  const { data } = await api.post<{
    message: string
    recovery_codes: string[]
  }>("/2fa/recovery-codes", { current_password })
  return data
}

export async function verifyTwoFactorLogin(challenge_token: string, code: string) {
  const { data } = await api.post<{
    message: string
    user: User
    token: string
  }>("/2fa/verify-login", { challenge_token, code })
  return data
}

export async function getProductPriceRange() {
  const { data } = await api.get<{ min_price: number; max_price: number }>("/products/price-range")
  return data
}

export async function getBestSellers() {
  const { data } = await api.get<Product[]>("/products/best-sellers")
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

export async function addToCart(product_id: number, quantity: number = 1, variant_id?: number) {
  const { data } = await api.post<{ cart: CartItem; message: string }>("/cart", {
    product_id,
    quantity,
    variant_id,
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
  shipping_method_id?: number
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

export interface OrderQuery {
  page?: number
  per_page?: number
}

export async function getOrders(params?: OrderQuery) {
  const { data } = await api.get<PaginatedResponse<Order>>("/orders", { params })
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

export interface ProductProfit {
  id: number
  name: string
  purchase_price: number
  selling_price: number
  total_sold: number
  total_revenue: number
  total_cost: number
  profit: number
  margin_percentage: number
}

export interface ProductProfitResponse {
  data: ProductProfit[]
  total_count: number
  current_page: number
  per_page: number
  last_page: number
  summary: {
    total_revenue: number
    total_cost: number
    total_profit: number
  }
}

export async function adminGetProductProfits(params?: { page?: number; per_page?: number }) {
  const { data } = await api.get<ProductProfitResponse>("/admin/dashboard/product-profits", { params })
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

export async function adminGetProductReferences(id: number) {
  const { data } = await api.get<ProductReferences>(`/admin/products/${id}/references`)
  return data
}

export async function adminDeleteProduct(id: number, force: boolean = false) {
  const { data } = await api.delete<{ message: string }>(`/admin/products/${id}`, {
    params: { force: force ? "1" : "0" },
  })
  return data
}

export async function adminBulkUpdateProductStatus(ids: number[], isActive: boolean) {
  const { data } = await api.put<{ message: string; count: number }>("/admin/products/bulk-status", {
    ids,
    is_active: isActive,
  })
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
  page?: number
  per_page?: number
}

export async function adminGetOrders(params?: AdminOrderQuery) {
  const { data } = await api.get<PaginatedResponse<Order>>("/admin/orders", { params })
  return data
}

export async function adminUpdateOrderStatus(id: number, status: string) {
  const { data } = await api.put<{ message: string; order: Order }>(`/admin/orders/${id}/status`, { status })
  return data
}

// =========================
// ADMIN: INVOICES
// =========================

export interface AdminInvoiceQuery {
  status?: string
  payment_method?: string
  search?: string
  date_from?: string
  date_to?: string
  paid_from?: string
  paid_to?: string
  page?: number
  per_page?: number
}

export async function adminGetInvoices(params?: AdminInvoiceQuery) {
  const { data } = await api.get<PaginatedResponse<Invoice>>("/admin/invoices", { params })
  return data
}

export async function adminGetInvoice(id: number) {
  const { data } = await api.get<InvoiceDetailResponse>("/admin/invoices/" + id)
  return data
}

export async function adminUpdateInvoiceStatus(id: number, status: string) {
  const { data } = await api.put<{ message: string; data: Invoice }>("/admin/invoices/" + id + "/status", { status })
  return data
}

export async function adminGetInvoiceStats() {
  const { data } = await api.get<InvoiceStats>("/admin/invoices/stats")
  return data
}

export async function adminCreateInvoice(payload: {
  order_id: number
  total_amount: number
  due_date?: string
  notes?: string
}) {
  const { data } = await api.post<{ message: string; data: Invoice }>("/admin/invoices", payload)
  return data
}

export async function adminUpdateInvoice(id: number, payload: {
  total_amount?: number
  due_date?: string
  notes?: string
}) {
  const { data } = await api.put<{ message: string; data: Invoice }>("/admin/invoices/" + id, payload)
  return data
}

export async function adminDeleteInvoice(id: number) {
  const { data } = await api.delete<{ message: string }>("/admin/invoices/" + id)
  return data
}

export async function adminSendInvoice(id: number) {
  const { data } = await api.post<{ message: string }>("/admin/invoices/" + id + "/send")
  return data
}

export interface UserInvoiceQuery {
  order_id?: number
  status?: string
  page?: number
  per_page?: number
}

export async function getUserInvoices(params?: UserInvoiceQuery) {
  const { data } = await api.get<{ data: Invoice[]; current_page: number; last_page: number; per_page: number; total: number }>("/invoices", { params })
  return data
}

export async function getUserInvoice(id: number) {
  const { data } = await api.get<{ data: Invoice }>("/invoices/" + id)
  return data.data
}

// =========================
// ADMIN: PAYMENTS
// =========================

export interface AdminPaymentQuery {
  invoice_id?: number
  order_id?: number
  payment_type?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function adminGetPayments(params?: AdminPaymentQuery) {
  const { data } = await api.get<PaginatedResponse<Payment>>("/admin/payments", { params })
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
// PAYMENT HISTORY
// =========================

export async function getPayments() {
  const { data } = await api.get<{ data: InvoicePayment[] }>("/payments")
  return data.data
}

// =========================
// PRODUCT VARIANTS
// =========================

export interface VariantResponse {
  data: ProductVariant[]
  attribute_groups: Record<string, AttributeGroup>
}

export async function getProductVariants(productId: number) {
  const { data } = await api.get<VariantResponse>(`/products/${productId}/variants`)
  return data
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

export async function checkReviewEligibility(productId: number) {
  const { data } = await api.get<{
    eligible: boolean
    orders: { id: number; order_number: string }[]
  }>("/orders/eligible-for-review/" + productId)
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
// SETTINGS
// =========================

export async function getPublicSettings() {
  const { data } = await api.get<PublicSettings>("/settings/public")
  return data
}

export async function adminGetSettings() {
  const { data } = await api.get<AdminSettingsResponse>("/admin/settings")
  return data
}

export async function adminUpdateSettings(settings: Record<string, string>) {
  const { data } = await api.put<AdminSettingsResponse>("/admin/settings", { settings })
  return data
}

/** Upload a logo image (multipart/form-data) */
export async function adminUploadLogo(file: File) {
  const formData = new FormData()
  formData.append("logo", file)
  const { data } = await api.post<{ message: string; logo_url: string; logo_path: string }>("/admin/settings/logo", formData)
  return data
}

/** Delete the logo (reset to default) */
export async function adminDeleteLogo() {
  const { data } = await api.delete<{ message: string }>("/admin/settings/logo")
  return data
}

// =========================
// SHIPPING METHODS (Admin CRUD)
// =========================

export async function adminGetShippingMethods() {
  const { data } = await api.get<ShippingMethod[]>("/admin/shipping-methods")
  return data
}

export async function adminCreateShippingMethod(payload: {
  name: string
  description?: string
  cost: number
  estimated_days?: number
}) {
  const { data } = await api.post<{ message: string; shipping_method: ShippingMethod }>("/admin/shipping-methods", payload)
  return data
}

export async function adminUpdateShippingMethod(id: number, payload: Partial<{
  name: string
  description?: string
  cost: number
  estimated_days?: number
}>) {
  const { data } = await api.put<{ message: string; shipping_method: ShippingMethod }>(`/admin/shipping-methods/${id}`, payload)
  return data
}

export async function adminDeleteShippingMethod(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/shipping-methods/${id}`)
  return data
}

// =========================
// WISHLIST
// =========================

export async function getWishlist() {
  const { data } = await api.get<{ wishlist: WishlistItem[]; total: number; current_page: number; last_page: number; per_page: number }>("/wishlist")
  return data
}

export async function addToWishlist(productId: number) {
  const { data } = await api.post<{ message: string; wishlist: WishlistItem }>(`/wishlist/${productId}`)
  return data
}

export async function removeFromWishlist(productId: number) {
  const { data } = await api.delete<{ message: string }>(`/wishlist/${productId}`)
  return data
}

// =========================
// SHIPPING METHODS (Public — active only)
// =========================

// =========================
// COUPONS
// =========================

export interface CouponFormData {
  code: string
  type: "percentage" | "fixed"
  value: number
  is_active?: boolean
  is_auto_apply?: boolean
  starts_at?: string | null
  expires_at?: string | null
  min_order_amount?: number | null
  max_discount_amount?: number | null
  usage_limit?: number | null
  per_customer_limit?: number
  applies_to: "all" | "specific"
  product_ids?: number[]
  description?: string | null
}

export async function adminGetCoupons(params?: Record<string, string | number>) {
  const { data } = await api.get<PaginatedResponse<Coupon>>("/admin/coupons", { params })
  return data
}

export async function adminGetCoupon(id: number) {
  const { data } = await api.get<{ coupon: Coupon; stats: Record<string, unknown> }>("/admin/coupons/" + id)
  return data
}

export async function adminCreateCoupon(payload: CouponFormData) {
  const { data } = await api.post<{ message: string; coupon: Coupon }>("/admin/coupons", payload)
  return data
}

export async function adminUpdateCoupon(id: number, payload: Partial<CouponFormData>) {
  const { data } = await api.put<{ message: string; coupon: Coupon }>("/admin/coupons/" + id, payload)
  return data
}

export async function adminDeleteCoupon(id: number) {
  const { data } = await api.delete<{ message: string }>("/admin/coupons/" + id)
  return data
}

export async function adminToggleCouponActive(id: number) {
  const { data } = await api.put<{ message: string; coupon: Coupon }>("/admin/coupons/" + id + "/toggle-active")
  return data
}

export async function adminGetCouponStats() {
  const { data } = await api.get<CouponStats>("/admin/coupons/stats")
  return data
}

export async function checkCoupon(code: string, subtotal: number, guest_email?: string) {
  const { data } = await api.post<CouponCheckResult>("/coupon/check", { code, subtotal, guest_email })
  return data
}

export async function getPublicShippingMethods() {
  const { data } = await api.get<ShippingMethod[]>("/shipping-methods")
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

// =========================
// SOCIAL ACCOUNTS
// =========================

export async function getSocialAccounts() {
  const { data } = await api.get<{ accounts: import("@/lib/types").SocialAccount[] }>("/social-accounts")
  return data.accounts
}

export async function unlinkSocialAccount(id: number) {
  const { data } = await api.delete<{ message: string }>(`/social-accounts/${id}`)
  return data
}

// =========================
// REFUNDS (Customer)
// =========================

export async function getMyRefunds() {
  const { data } = await api.get<Refund[]>("/refunds")
  return data
}

export async function getMyRefund(id: number) {
  const { data } = await api.get<Refund>("/refunds/" + id)
  return data
}

export async function createRefund(formData: FormData) {
  const { data } = await api.post<{ message: string; refund: Refund }>("/refunds", formData)
  return data
}

export async function getRefundableItems(orderId: number) {
  const { data } = await api.get<RefundableItemsResponse>("/orders/" + orderId + "/refundable-items")
  return data
}

// =========================
// REFUNDS (Admin)
// =========================

export interface AdminRefundQuery {
  status?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function adminGetRefunds(params?: AdminRefundQuery) {
  const { data } = await api.get<PaginatedResponse<Refund>>("/admin/refunds", { params })
  return data
}

export async function adminGetRefund(id: number) {
  const { data } = await api.get<Refund>("/admin/refunds/" + id)
  return data
}

export async function adminApproveRefund(id: number) {
  const { data } = await api.put<{ message: string; refund: Refund }>("/admin/refunds/" + id + "/approve")
  return data
}

export async function adminRejectRefund(id: number, reason?: string) {
  const { data } = await api.put<{ message: string; refund: Refund }>("/admin/refunds/" + id + "/reject", { reason })
  return data
}

export async function adminCompleteRefund(id: number) {
  const { data } = await api.put<{ message: string; refund: Refund }>("/admin/refunds/" + id + "/complete")
  return data
}

export async function adminUpdateRefundNotes(id: number, notes: string) {
  const { data } = await api.put<{ message: string; refund: Refund }>("/admin/refunds/" + id + "/notes", { notes })
  return data
}

export async function adminGetRefundStats() {
  const { data } = await api.get<RefundDashboardStats>("/admin/refunds/stats")
  return data
}

// =========================
// PROMOTIONS (Public)
// =========================

export async function getActivePromotions() {
  const { data } = await api.get<ActivePromotionsResponse>("/promotions/all")
  return data
}

export async function getHeroBanners() {
  const { data } = await api.get<{ data: Promotion[] }>("/promotions/hero-banners")
  return data.data
}

export async function getAnnouncementBars() {
  const { data } = await api.get<{ data: Promotion[] }>("/promotions/announcement-bars")
  return data.data
}

// =========================
// PROMOTIONS (Admin)
// =========================

export interface AdminPromotionQuery {
  position?: string
  status?: string
  search?: string
  page?: number
  per_page?: number
}

export async function adminGetPromotions(params?: AdminPromotionQuery) {
  const { data } = await api.get<PaginatedResponse<Promotion>>("/admin/promotions", { params })
  return data
}

export async function adminGetPromotion(id: number) {
  const { data } = await api.get<{ data: Promotion }>("/admin/promotions/" + id)
  return data.data
}

export async function adminCreatePromotion(formData: FormData) {
  const { data } = await api.post<{ message: string; data: Promotion }>("/admin/promotions", formData)
  return data
}

export async function adminUpdatePromotion(id: number, formData: FormData) {
  // Laravel requires _method=POST for multipart POST updates
  const { data } = await api.post<{ message: string; data: Promotion }>("/admin/promotions/" + id, formData)
  return data
}

export async function adminDeletePromotion(id: number) {
  const { data } = await api.delete<{ message: string }>("/admin/promotions/" + id)
  return data
}

export async function adminTogglePromotionActive(id: number) {
  const { data } = await api.put<{ message: string; data: Promotion }>("/admin/promotions/" + id + "/toggle-active")
  return data
}

export async function adminGetPromotionStats() {
  const { data } = await api.get<{ data: PromotionStats }>("/admin/promotions/stats")
  return data.data
}

// =========================
// HOMEPAGE FEATURES (Public)
// =========================

export async function getHomepageFeatures() {
  const { data } = await api.get<{ data: FeatureCard[] }>("/homepage-features")
  return data.data
}

// =========================
// HOMEPAGE FEATURES (Admin)
// =========================

export async function adminGetHomepageFeatures() {
  const { data } = await api.get<PaginatedResponse<FeatureCard>>("/admin/homepage-features")
  return data
}

export async function adminGetHomepageFeature(id: number) {
  const { data } = await api.get<{ data: FeatureCard }>("/admin/homepage-features/" + id)
  return data.data
}

export async function adminCreateHomepageFeature(payload: Record<string, unknown>) {
  const { data } = await api.post<{ message: string; data: FeatureCard }>("/admin/homepage-features", payload)
  return data
}

export async function adminUpdateHomepageFeature(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<{ message: string; data: FeatureCard }>("/admin/homepage-features/" + id, payload)
  return data
}

export async function adminDeleteHomepageFeature(id: number) {
  const { data } = await api.delete<{ message: string }>("/admin/homepage-features/" + id)
  return data
}

export async function adminToggleHomepageFeatureActive(id: number) {
  const { data } = await api.put<{ message: string; data: FeatureCard }>("/admin/homepage-features/" + id + "/toggle-active")
  return data
}

export async function adminReorderHomepageFeatures(items: { id: number; sort_order: number }[]) {
  const { data } = await api.post<{ message: string }>("/admin/homepage-features/reorder", { items })
  return data
}

// =========================
// FEATURED REVIEWS (Public)
// =========================

export async function getFeaturedReviews() {
  const { data } = await api.get<{ data: FeaturedReview[] }>("/featured-reviews")
  return data.data
}

// =========================
// FEATURED REVIEWS (Admin)
// =========================

export interface AdminFeaturedReviewQuery {
  featured?: string
  rating?: number
  product_id?: number
  user_id?: number
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function adminGetFeaturedReviews(params?: AdminFeaturedReviewQuery) {
  const { data } = await api.get<PaginatedResponse<Review>>("/admin/featured-reviews", { params })
  return data
}

export async function adminGetFeaturedReview(id: number) {
  const { data } = await api.get<{ data: Review }>("/admin/featured-reviews/" + id)
  return data.data
}

export async function adminToggleReviewFeatured(id: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/featured-reviews/" + id + "/toggle-featured")
  return data
}

export async function adminToggleFeaturedActive(id: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/featured-reviews/" + id + "/toggle-active")
  return data
}

export async function adminUpdateFeaturedOrder(id: number, featured_order: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/featured-reviews/" + id + "/order", { featured_order })
  return data
}

export async function adminReorderFeaturedReviews(items: { id: number; featured_order: number }[]) {
  const { data } = await api.post<{ message: string }>("/admin/featured-reviews/reorder", { items })
  return data
}

export async function adminGetFeaturedReviewStats() {
  const { data } = await api.get<{ data: FeaturedReviewStats }>("/admin/featured-reviews/stats")
  return data.data
}

export async function adminGetFeaturedReviewProducts() {
  const { data } = await api.get<{ data: FeaturedReviewProduct[] }>("/admin/featured-review-products")
  return data.data
}

// =========================
// REVIEW MODERATION (Admin)
// =========================

export interface AdminReviewQuery {
  status?: string
  rating?: number
  product_id?: number
  featured?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function adminGetAllReviews(params?: AdminReviewQuery) {
  const { data } = await api.get<PaginatedResponse<Review>>("/admin/reviews", { params })
  return data
}

export async function adminGetReview(id: number) {
  const { data } = await api.get<{ data: Review }>("/admin/reviews/" + id)
  return data.data
}

export async function adminApproveReview(id: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/reviews/" + id + "/approve")
  return data
}

export async function adminRejectReview(id: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/reviews/" + id + "/reject")
  return data
}

export async function adminPendingReview(id: number) {
  const { data } = await api.put<{ message: string; data: Review }>("/admin/reviews/" + id + "/pending")
  return data
}

export async function adminBulkApproveReviews(ids: number[]) {
  const { data } = await api.post<{ message: string; count: number }>("/admin/reviews/bulk-approve", { ids })
  return data
}

export async function adminBulkRejectReviews(ids: number[]) {
  const { data } = await api.post<{ message: string; count: number }>("/admin/reviews/bulk-reject", { ids })
  return data
}

export async function adminGetReviewModerationStats() {
  const { data } = await api.get<{ data: ReviewModerationStats }>("/admin/reviews/stats")
  return data.data
}

export async function adminGetReviewProducts() {
  const { data } = await api.get<{ data: { id: number; name: string; slug: string; reviews_count: number }[] }>("/admin/review-products")
  return data.data
}