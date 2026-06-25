import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { convertFromMAD, formatPriceInCurrency, DEFAULT_CURRENCY } from './currency/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STORAGE_KEY = 'preferred_currency'

function getStoredCurrency(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ['MAD', 'USD', 'EUR'].includes(stored)) return stored
  } catch {
    // localStorage not available
  }
  return DEFAULT_CURRENCY
}

/**
 * Format a price value from MAD (base currency) into the user's preferred currency.
 *
 * @param value - The price amount in MAD (as stored in the database)
 * @param currency - Optional explicit currency code (MAD, USD, EUR). Defaults to user's stored preference or USD.
 *
 * @example
 *   formatPrice(250)           // "$24.50" (250 MAD converted to USD at default rate)
 *   formatPrice(250, 'MAD')    // "250,00 MAD"
 *   formatPrice(250, 'EUR')    // "23,00 €" (250 MAD converted to EUR)
 */
export function formatPrice(value: number | string, currency?: string): string {
  const amountInMAD = Number(value)
  const targetCurrency = currency ?? getStoredCurrency()
  return formatPriceInCurrency(amountInMAD, targetCurrency)
}
