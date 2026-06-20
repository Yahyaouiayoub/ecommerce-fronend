"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const SIDEBAR_WIDTH_KEY = "admin_sidebar_collapsed"

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    if (stored === "true") {
      setCollapsedState(true)
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(value))
  }, [])

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(next))
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
