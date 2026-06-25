// =========================
// ADDRESS
// =========================
export interface Address {
  id: number
  user_id: number | null
  full_name: string
  email?: string
  phone?: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  is_default: boolean
  label?: string
  created_at?: string
  full_address?: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: "admin" | "client"
  avatar?: string
  phone?: string
  last_login_at?: string
  address?: string
  city?: string
  country?: string
  created_at?: string
  full_name?: string
  addresses?: Address[]
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  is_active: boolean
  products_count?: number
}

export interface Brand {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  is_active: boolean
  products_count?: number
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  sort_order: number
}

export interface Review {
  id: number
  product_id: number
  user_id: number
  order_id: number
  rating: number
  comment?: string
  created_at: string
  user?: {
    id: number
    first_name: string
    last_name: string
    avatar?: string
  }
}

export interface ProductReviewsResponse {
  reviews: Review[]
  average_rating: number
  total_reviews: number
  rating_distribution: Record<number, number>
}

export interface CreateReviewPayload {
  product_id: number
  order_id: number
  rating: number
  comment?: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  purchase_price: number
  margin_percentage: number
  final_price: number
  discount_price?: number | null
  stock: number
  brand_id?: number
  brand?: Brand
  sku?: string
  thumbnail?: string
  is_active: boolean
  featured: boolean
  category_id: number
  category?: Category
  images?: ProductImage[]
  reviews_avg_rating?: number
  reviews_count?: number
}

export interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: Product
}

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price: number
  product: Product
}

export interface Payment {
  id: number
  order_id: number
  amount: number
  currency: string
  payment_method: string
  status: string
  paid_at?: string
}

export interface InvoicePayment {
  id: number
  invoice_id: number
  order_id: number
  amount: number
  amount_formatted: string
  payment_method: string
  payment_type: "full" | "partial_20" | "partial_30" | "partial_50" | "partial_60" | "partial_70" | "partial_80" | "custom"
  payment_type_label: string
  status: string
  status_label: string
  paid_at?: string
  created_at: string
}

export type InvoiceStatus = "unpaid" | "partially_paid" | "paid" | "pending" | "failed" | "refunded" | "cancelled"

export interface InvoiceOrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  price_formatted: string
  subtotal: number
  subtotal_formatted: string
}

export interface InvoiceOrder {
  id: number
  order_number: string
  total_price: number
  status: string
  status_label: string
  created_at: string
  customer?: {
    id: number
    full_name: string
    email: string
    phone?: string
  }
  address?: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state?: string
    postal_code?: string
    country: string
    email?: string
    phone?: string
  }
  items?: InvoiceOrderItem[]
}

export interface Invoice {
  id: number
  order_id: number
  invoice_number: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: InvoiceStatus
  status_label: string
  status_color: string
  total_formatted: string
  paid_formatted: string
  remaining_formatted: string
  due_date?: string
  notes?: string
  billing_name?: string
  billing_email?: string
  billing_phone?: string
  billing_address?: string
  payment_method?: string
  issued_at?: string
  paid_at?: string
  created_at: string
  updated_at: string
  payments?: InvoicePayment[]
  order?: InvoiceOrder
}

export interface InvoiceDetailResponse {
  data: Invoice
  meta?: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
}

export interface PaymentOption {
  label: string
  amount: number | null
  amount_formatted?: string
  max?: number
  max_formatted?: string
}

export interface InvoicePaymentOptions {
  invoice_id: number
  invoice_number: string
  remaining: number
  remaining_formatted: string
  options: Record<string, PaymentOption>
}

export interface OrderPaymentSummary {
  order_id: number
  order_number: string
  order_total: number
  total_paid: number
  remaining_to_pay: number
  payment_count: number
  invoices: {
    id: number
    invoice_number: string
    total_amount: number
    paid_amount: number
    remaining_amount: number
    status: string
    payment_count: number
  }[]
  payments: InvoicePayment[]
}

export interface InvoiceStats {
  total_invoices: number
  paid_invoices: number
  pending_invoices: number
  refunded_invoices: number
  failed_invoices: number
  cancelled_invoices: number
  total_revenue: number
  total_pending_amount: number
}

export interface InvoiceSettings {
  auto_generate: boolean
  prefix: string
  number_format: string
  company_name: string
  company_address: string
  company_city: string
  company_country: string
  company_phone: string
  company_email: string
  payment_terms: number
  footer_notes: string
}

export interface Order {
  id: number
  order_number: string
  user_id: number
  total_price: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_method: string
  address_id?: number
  address?: Address
  notes?: string
  created_at: string
  items: OrderItem[]
  payment?: Payment
  user?: User
  invoices?: Invoice[]
}

export interface AuthResponse {
  user: User
  token: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

// =========================
// SHIPPING METHODS
// =========================
export interface ShippingMethod {
  id: number
  name: string
  description?: string
  cost: number
  estimated_days?: number
  sort_order: number
  is_active: boolean
  created_at?: string
}

// =========================
// SHIPPING & TAX SETTINGS
// =========================
export interface ShippingSettings {
  enabled: boolean
  free_shipping: boolean
  free_shipping_min: number
  standard_cost: number
  message: string
}

export interface TaxSettings {
  enabled: boolean
  rate: number
  type: "percentage" | "fixed"
  label: string
}

export interface PublicSettings {
  shipping: ShippingSettings
  tax: TaxSettings
  logo_url: string
  company_name?: string
  company_address?: string
  company_city?: string
  company_country?: string
  company_phone?: string
  company_email?: string
}

export interface AdminSettingsResponse {
  settings: Record<string, Record<string, string>>
  shipping: ShippingSettings
  tax: TaxSettings
  invoice: InvoiceSettings
  logo_url: string
}

// =========================
// ADMIN / DASHBOARD
// =========================

export interface MonthData {
  year: number
  month: number
  total: number
}

export interface OrdersMonthData extends MonthData {
  delivered: number
  pending: number
  cancelled: number
  processing: number
  shipped: number
}

export interface DashboardStats {
  // Revenue analytics (from paid invoices)
  total_revenue: number
  revenue_this_month: number
  revenue_today: number
  revenue_by_month: MonthData[]

  // Order counts
  total_orders: number
  pending_orders: number
  processing_orders: number
  shipped_orders: number
  delivered_orders: number
  cancelled_orders: number
  orders_by_month: OrdersMonthData[]

  // Product & User stats
  total_products: number
  active_products: number
  featured_products: number
  low_stock_products: number
  out_of_stock: number
  total_users: number
  total_admins: number

  // Legacy fields (backward compat)
  total_expenses: number
  net_revenue: number
  orders_by_status: Record<string, number>

  // Cart analytics
  total_carts: number
  active_carts: number
  abandoned_carts: number
  converted_carts: number

  // Invoice statistics
  total_invoices: number
  paid_invoices: number
  pending_invoices: number
  refunded_invoices: number
  failed_invoices: number
  cancelled_invoices: number
  total_pending_amount: number

  // Recent orders
  recent_orders: {
    id: number
    order_number: string
    customer: string
    total_price: number
    status: string
    created_at: string
  }[]
}

export interface AdminProductPayload {
  category_id: number
  brand_id?: number
  name: string
  description?: string
  price: number
  purchase_price?: number
  margin_percentage?: number
  discount_price?: number | null
  stock?: number
  sku?: string
  thumbnail?: string
  video_url?: string
  featured?: boolean
  is_active?: boolean
}

export interface AdminBrandPayload {
  name: string
  description?: string
  image?: string
  is_active?: boolean
}

export interface AdminCategoryPayload {
  name: string
  description?: string
  image?: string
  is_active?: boolean
}

export interface AdminUserPayload {
  first_name: string
  last_name: string
  email: string
  password?: string
  role: "admin" | "client"
  phone?: string
  address?: string
  city?: string
  country?: string
}

export interface UserSummary {
  total: number
  admins: number
  clients: number
  new_today: number
  new_this_month: number
}

// =========================
// EXPENSES
// =========================

export interface Expense {
  id: number
  title: string
  amount: number
  amount_formatted: string
  category?: string
  category_label?: string
  note?: string
  description?: string
  expense_date: string
  created_by?: number
  creator?: {
    id: number
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface ExpenseMonthData {
  year: number
  month: number
  total: number
  count: number
}

export interface ExpenseCategoryData {
  category: string
  category_label: string
  total: number
  count: number
  percentage: number
}

export interface ExpensePayload {
  title: string
  amount: number
  category?: string
  description?: string
  expense_date: string
}

// =========================
// ADMIN: CARTS
// =========================

export interface AdminCartItem {
  id: number
  product_id: number
  quantity: number
  product: Product
  price: number
  subtotal: number
  created_at: string
}

export interface AdminCart {
  id: string // "user_{id}" or "session_{sessionId}"
  user_id: number | null
  session_id: string | null
  user: User | null
  status: "active" | "abandoned" | "converted"
  items: AdminCartItem[]
  item_count: number
  total_value: number
  created_at: string
  updated_at: string
}

// =========================
// FINANCIAL DASHBOARD
// =========================

export interface RevenueVsExpenseData {
  year: number
  month: number
  revenue: number
  expenses: number
}

export interface MonthlyProfitData {
  year: number
  month: number
  profit: number
}

export interface CollectionRateData {
  paid_count: number
  unpaid_count: number
  partial_count: number
  total_count: number
  rate: number
}

export interface FinancialDashboardData {
  total_revenue: number
  total_expenses: number
  net_profit: number
  pending_payments: number
  unpaid_invoices: number
  revenue_vs_expenses: RevenueVsExpenseData[]
  monthly_profit: MonthlyProfitData[]
  collection_rate: CollectionRateData
}