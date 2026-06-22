import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
})

// Helper for images
const PLACEHOLDER = "/placeholder.svg"
const FAKE_PATHS = new Set(["/product.jpg"])

/**
 * Resolves a product image path to a full URL.
 *
 * The Laravel API stores images as relative paths (e.g. "products/thumbnails/abc.jpg")
 * inside the public disk. The `storage` symlink makes them accessible at:
 *   {STORAGE_URL}/{relative_path}
 *
 * This function also handles:
 * - Absolute URLs (passed through as-is)
 * - Paths starting with /storage/ (strips the prefix to avoid doubling)
 * - Paths starting with / (prepends STORAGE_URL)
 * - Known fake/placeholder paths (returns placeholder)
 */
export function getImageUrl(path: string | undefined): string {
  if (!path) return PLACEHOLDER
  if (FAKE_PATHS.has(path)) return PLACEHOLDER
  if (path.startsWith("http")) return path
  // If path already includes /storage/, strip it to avoid STORAGE_URL + /storage/... doubling
  if (path.startsWith("/storage/")) return `${STORAGE_URL}/${path.slice(9)}`
  if (path.startsWith("/")) return `${STORAGE_URL}${path}`
  return `${STORAGE_URL}/${path}`
}

/**
 * Returns true when an image URL points to the local storage server
 * (i.e. it needs Next.js image optimization skipped for speed).
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith(STORAGE_URL)
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  if (data?.errors) {
    const firstField = Object.values(data.errors)[0]
    if (firstField?.[0]) return firstField[0]
  }

  if (data?.message && data.message !== "Server Error") return data.message

  if (error.response?.status === 419) {
    return "Session expired. Refresh the page and try again."
  }

  return fallback
}

// Token management
const TOKEN_KEY = "auth_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
  // Sync to cookie so Next.js middleware can read it
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`
}

export function removeToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  // Remove cookie for middleware
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
}

// Session ID for guest cart
const SESSION_KEY = "guest_session_id"

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

// Request interceptor
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add session_id for guest
  if (!token) {
    const sessionId = getSessionId()
    if (sessionId) {
      config.headers["X-Session-Id"] = sessionId
    }
  }

  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
    }
    return Promise.reject(error)
  }
)