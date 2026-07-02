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
  status: "pending" | "approved" | "rejected"
  is_featured?: boolean
  is_featured_active?: boolean
  featured_order?: number
  is_verified_purchase?: boolean
  created_at: string
  updated_at?: string
  user?: {
    id: number
    first_name: string
    last_name: string
    email?: string
    avatar?: string
    full_name?: string
  }
  product?: {
    id: number
    name: string
    slug: string
    thumbnail?: string
  }
}

export interface ReviewModerationStats {
  total_reviews: number
  pending_reviews: number
  approved_reviews: number
  rejected_reviews: number
  avg_rating: number
}

export interface FeaturedReview extends Review {
  is_featured: true
  is_featured_active: boolean
  featured_order: number
}

export interface ProductReviewsResponse {
  reviews: Review[]
  current_page: number
  last_page: number
  per_page: number
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

export interface FeaturedReviewStats {
  totalReviews: number
  featuredReviews: number
  activeFeatured: number
  avgRatingFeatured: number
}

export interface FeaturedReviewProduct {
  id: number
  name: string
  slug: string
  reviews_count: number
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  price: number | null
  effective_price: number
  price_formatted: string
  stock: number
  sku: string | null
  color: string | null
  size: string | null
  storage: string | null
  attributes: Record<string, string> | null
  is_default: boolean
  sort_order: number
  in_stock: boolean
  stock_status: string
  created_at?: string
  updated_at?: string
}

export interface AttributeGroup {
  label: string
  options: Record<string, { value: string; variant_id: number }>
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
  variants?: ProductVariant[]
  related_products?: Product[]
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
  invoice_id: number
  order_id: number
  amount: number
  amount_formatted: string
  currency: string
  payment_method: string
  payment_type: string
  payment_type_label: string
  status: string
  status_label: string
  transaction_id?: string
  paid_at?: string
  created_at: string
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
  refund_status?: string
  refund_amount?: number
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
  coupons_enabled?: boolean
}

export interface PublicSettingsWithPayPal extends PublicSettings {
  paypal_enabled?: boolean
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

// =========================
// COUPON
// =========================
export interface Coupon {
  id: number
  code: string
  type: "percentage" | "fixed"
  value: number
  is_active: boolean
  is_auto_apply?: boolean
  starts_at: string | null
  expires_at: string | null
  min_order_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  per_customer_limit: number
  applies_to: "all" | "specific"
  description: string | null
  products?: Product[]
  usages_count?: number
  remaining_uses?: number
  is_expired?: boolean
  created_at: string
  updated_at: string
}

export interface CouponStats {
  total_coupons: number
  active_coupons: number
  valid_now_coupons: number
  total_discount_given: number
  total_usage_count: number
  most_used_coupons: {
    id: number
    code: string
    type: string
    value: number
    usages_count: number
    total_discount: number
  }[]
}

export interface CouponCheckResult {
  valid: boolean
  message: string
  discount?: number
  is_auto_apply?: boolean
  auto_apply_checked?: boolean
  coupon?: {
    code: string
    type: string
    value: number
  }
}

// =========================
// WISHLIST
// =========================
export interface WishlistItem {
  id: number
  user_id: number
  product_id: number
  product: Product
  created_at: string
}

export interface MostWishlistedProduct {
  id: number
  name: string
  slug: string
  thumbnail?: string
  wishlists_count: number
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

  // Refund stats
  total_refunds: number
  pending_refunds: number
  approved_refunds: number
  rejected_refunds: number
  completed_refunds: number
  total_refunded_amount: number
  top_refunded_products: {
    product_name: string
    total_qty: number
    total_amount: number
  }[]

  // Refund alert
  refund_alert_count: number

  // Coupon stats
  total_coupons: number
  active_coupons: number
  total_coupon_discount: number
  total_coupon_uses: number
  most_used_coupon: {
    coupon_id: number
    usage_count: number
    total_discount: number
    coupon: {
      id: number
      code: string
      type: string
      value: number
    } | null
  } | null

  // Wishlist stats
  total_wishlist_items: number
  most_wishlisted_products: MostWishlistedProduct[]

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

export interface ProductReferences {
  has_references: boolean
  references: {
    orders: number
    invoices: number
    reviews: number
    wishlists: number
    carts: number
    expenses: number
    coupons: number
  }
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
// REFUND
// =========================
export type RefundStatus = "pending" | "approved" | "rejected" | "completed"

export interface RefundImage {
  id: number
  refund_id: number
  image_path: string
  created_at: string
}

export interface RefundItemData {
  id: number
  refund_id: number
  order_item_id: number
  quantity: number
  amount: number
  orderItem?: {
    id: number
    product_id: number
    product?: Product
    quantity: number
    price: number
  }
}

export interface Refund {
  id: number
  order_id: number
  user_id: number | null
  refund_number: string
  status: RefundStatus
  status_label: string
  status_color: string
  reason: string | null
  description: string | null
  refund_amount: number
  refund_amount_formatted: string
  internal_notes: string | null
  guest_email: string | null
  guest_name: string | null
  requester_name: string
  requester_email: string
  approved_at: string | null
  rejected_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  items?: RefundItemData[]
  images?: RefundImage[]
  order?: Order
  user?: User
}

export interface RefundFormData {
  order_id: number
  reason: string
  description?: string
  items: { order_item_id: number; quantity: number }[]
  images?: File[]
}

export interface RefundableItemsResponse {
  items: {
    id: number
    product_id: number
    product?: Product
    quantity: number
    price: number
    refundable_quantity: number
    max_refund_amount: number
  }[]
  max_refundable: number
  order_total: number
  already_refunded: number
}

export interface RefundDashboardStats {
  total_refunds: number
  pending_refunds: number
  approved_refunds: number
  rejected_refunds: number
  completed_refunds: number
  total_refunded_amount: number
  top_refunded_products: {
    product_name: string
    total_qty: number
    total_amount: number
  }[]
}

// =========================
// HOMEPAGE FEATURES
// =========================

export interface FeatureCard {
  id: number
  icon_key: string
  title: string
  description?: string
  link_url?: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface FeatureCardFormData {
  icon_key: string
  title: string
  description?: string
  link_url?: string
  sort_order?: number
  is_active?: boolean
}

// =========================
// PROMOTIONS / BANNERS
// =========================

export type PromotionPosition = 'announcement_bar' | 'hero_banner' | 'both'

export interface Promotion {
  id: number
  title: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_url?: string
  background_image?: string | null
  background_image_url?: string | null
  mobile_image?: string | null
  mobile_image_url?: string | null
  background_color?: string
  text_color?: string
  discount_text?: string
  badge?: string
  starts_at?: string | null
  ends_at?: string | null
  is_active: boolean
  status_label: string
  priority: number
  position: PromotionPosition
  created_at?: string
  updated_at?: string
}

export interface PromotionFormData {
  title: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_url?: string
  background_color?: string
  text_color?: string
  discount_text?: string
  badge?: string
  starts_at?: string | null
  ends_at?: string | null
  is_active?: boolean
  priority?: number
  position: PromotionPosition
  background_image_file?: File | null
  mobile_image_file?: File | null
}

export interface PromotionStats {
  total: number
  active: number
  scheduled: number
  expired: number
  disabled: number
  by_position: {
    hero_banner: number
    announcement_bar: number
    both: number
  }
}

export interface ActivePromotionsResponse {
  hero_banners: Promotion[]
  announcement_bars: Promotion[]
}

// =========================
// SOCIAL ACCOUNTS
// =========================

export interface SocialAccount {
  id: number
  provider: string
  provider_label: string
  provider_id: string
  linked_at: string
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