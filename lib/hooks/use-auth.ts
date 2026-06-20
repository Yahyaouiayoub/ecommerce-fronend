"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getToken, setToken, removeToken } from "@/lib/api/client"
import { useAppDispatch } from "@/lib/store"
import { fetchCartFromServer, clearCart } from "@/lib/store/cart-slice"
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
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
      // Fetch guest cart by session_id
      dispatch(fetchCartFromServer())
      return
    }

    getMe()
      .then((userData) => {
        if (!cancelled) {
          setUser(userData)
          // Fetch this user's cart from server
          dispatch(fetchCartFromServer())
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

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginRequest(payload)
    setToken(res.token)
    setUser(res.user)

    // Fetch user's cart from server (backend mergeGuestCart already merged guest cart)
    await dispatch(fetchCartFromServer()).unwrap()

    return res.user
  }, [dispatch])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerRequest(payload)
    setToken(res.token)
    setUser(res.user)

    // Fetch user's cart from server (backend mergeGuestCart already merged guest cart)
    await dispatch(fetchCartFromServer()).unwrap()

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
    localStorage.removeItem(CART_STORAGE_KEY)
    localStorage.removeItem(SESSION_KEY)
  }, [dispatch])

  return { user, loading, login, register, logout, refresh, setUser }
}