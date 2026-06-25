"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { DEFAULT_CURRENCY, convertFromMAD, formatPriceInCurrency, type CurrencyCode } from "./config"

const STORAGE_KEY = "preferred_currency"

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  /** Convert a MAD amount to the current currency */
  convert: (amountInMAD: number) => number
  /** Format a MAD amount in the current currency */
  format: (amountInMAD: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY)

  // Load saved preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['MAD', 'USD', 'EUR'].includes(stored)) {
        setCurrencyState(stored as CurrencyCode)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // localStorage not available
    }
  }, [])

  const convert = useCallback(
    (amountInMAD: number) => convertFromMAD(amountInMAD, currency),
    [currency],
  )

  const format = useCallback(
    (amountInMAD: number) => formatPriceInCurrency(amountInMAD, currency),
    [currency],
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return ctx
}
