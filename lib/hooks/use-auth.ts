"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getToken, setToken, removeToken, getSessionId } from "@/lib/api/client"
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  mergeCart,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/api/services"

const SESSION_KEY = "guest_session_id"

export function useAuth() {
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
    if (!token) return

    getMe()
      .then((userData) => {
        if (!cancelled) setUser(userData)
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
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginRequest(payload)
    setToken(res.token)
    setUser(res.user)

    // Merge guest cart
    const sessionId = getSessionId()
    if (sessionId) {
      try {
        await mergeCart(sessionId)
        localStorage.removeItem(SESSION_KEY)
      } catch {
        // Ignore merge errors
      }
    }

    return res.user
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerRequest(payload)
    setToken(res.token)
    setUser(res.user)

    const sessionId = getSessionId()
    if (sessionId) {
      try {
        await mergeCart(sessionId)
        localStorage.removeItem(SESSION_KEY)
      } catch {
        // Ignore merge errors
      }
    }

    return res.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Ignore
    }
    removeToken()
    setUser(null)
  }, [])

  return { user, loading, login, register, logout, refresh, setUser }
}