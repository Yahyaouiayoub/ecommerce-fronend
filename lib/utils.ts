import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price value in USD.
 *
 * @param value - The price amount in USD
 *
 * @example
 *   formatPrice(24.50)         // "$24.50"
 *   formatPrice(100)           // "$100.00"
 */
export function formatPrice(value: number | string): string {
  const amount = Number(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
