"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getToken, setToken, removeToken } from "@/lib/api/client"
import { useAppDispatch } from "@/lib/store"
import { fetchCartFromServer, clearCart } from "@/lib/store/cart-slice"
import { fetchWishlist } from "@/lib/store/wishlist-slice"
import { getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyTwoFactorLogin,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/api/services"

const SESSION_KEY = "guest_session_id"
const CART_STORAGE_KEY = "cart_items"

export function useAuth() {
  const dispatch = useAppDispatch()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true
    return !!getToken()
  })

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const userData = await getMe()
      setUser(userData)
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const token = getToken()
    if (!token) {
      setLoading(false)
      // Fetch guest cart (thunk skips if recently fetched, e.g. within 60s)
      dispatch(fetchCartFromServer())
      return
    }

    getMe()
      .then((userData) => {
        if (!cancelled) {
          setUser(userData)
          // Fetch user cart (thunk skips if recently fetched)
          dispatch(fetchCartFromServer())
          dispatch(fetchWishlist())
        }
      })
      .catch(() => {
        if (!cancelled) {
          removeToken()
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dispatch])

  const login = useCallback(async (payload: LoginPayload): Promise<{ user: User; two_factor_required?: boolean; challenge_token?: string }> => {
    const res = await loginRequest(payload)

    // If 2FA is required, return challenge info without setting token
    if ((res as any).two_factor_required) {
      return {
        user: res.user,
        two_factor_required: true,
        challenge_token: (res as any).challenge_token,
      }
    }

    setToken(res.token)
    setUser(res.user)

    // Fetch user's cart from server (backend mergeGuestCart already merged guest cart)
    // Force fetch — user just logged in, cart data may have changed
    await dispatch(fetchCartFromServer({ force: true })).unwrap()
    // Fetch wishlist for logged-in user
    dispatch(fetchWishlist())

    return { user: res.user }
  }, [dispatch])

  const verify2FA = useCallback(async (challenge_token: string, code: string) => {
    const res = await verifyTwoFactorLogin(challenge_token, code)
    setToken(res.token)
    setUser(res.user)

    // Fetch user's cart from server (force — 2FA challenge may have changed cart)
    await dispatch(fetchCartFromServer({ force: true })).unwrap()
    // Fetch wishlist for logged-in user
    dispatch(fetchWishlist())

    return res.user
  }, [dispatch])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerRequest(payload)
    setToken(res.token)
    setUser(res.user)

    // Fetch user's cart from server (force — registration merged guest cart)
    await dispatch(fetchCartFromServer({ force: true })).unwrap()
    // Fetch wishlist for logged-in user
    dispatch(fetchWishlist())

    return res.user
  }, [dispatch])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Ignore server errors on logout
    }
    removeToken()
    setUser(null)
    // Clear all cart data — prevents data leaking to the next user
    dispatch(clearCart())
    dispatch({ type: "wishlist/clearWishlist" })
    localStorage.removeItem(CART_STORAGE_KEY)
    localStorage.removeItem(SESSION_KEY)
  }, [dispatch])

  return { user, loading, login, register, logout, refresh, setUser, verify2FA }
}