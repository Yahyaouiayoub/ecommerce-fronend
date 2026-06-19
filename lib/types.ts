export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: "admin" | "client"
  avatar?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  created_at?: string
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

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  sort_order: number
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  stock: number
  brand?: string
  sku?: string
  thumbnail?: string
  is_active: boolean
  featured: boolean
  category_id: number
  category?: Category
  images?: ProductImage[]
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

export interface Order {
  id: number
  order_number: string
  user_id: number
  total_price: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
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
  created_at: string
  items: OrderItem[]
  payment?: Payment
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