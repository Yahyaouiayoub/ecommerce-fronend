// Exchange rates relative to 1 MAD (Moroccan Dirham)
// These are approximate rates and should be updated periodically.
export const EXCHANGE_RATES: Record<string, number> = {
  MAD: 1,        // Base currency
  USD: 0.098,    // 1 MAD ≈ 0.098 USD
  EUR: 0.092,    // 1 MAD ≈ 0.092 EUR
}

export type CurrencyCode = 'MAD' | 'USD' | 'EUR'

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; locale: string }[] = [
  { code: 'MAD', label: 'MAD', symbol: 'MAD', locale: 'fr-MA' },
  { code: 'USD', label: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'EUR', symbol: '€', locale: 'de-DE' },
]

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

/**
 * Convert a MAD amount to the target currency.
 * All prices in the database are stored in MAD.
 */
export function convertFromMAD(amountInMAD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency]
  if (!rate) return amountInMAD // fallback to MAD if unknown currency
  return amountInMAD * rate
}

/**
 * Format a MAD amount in the target currency using Intl.NumberFormat.
 */
export function formatPriceInCurrency(
  amountInMAD: number,
  currencyCode: string,
): string {
  const rate = EXCHANGE_RATES[currencyCode]
  const converted = rate ? amountInMAD * rate : amountInMAD

  try {
    const currencyInfo = CURRENCIES.find((c) => c.code === currencyCode)
    if (currencyCode === 'MAD') {
      // MAD uses a specific format
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
      }).format(converted)
    }
    return new Intl.NumberFormat(currencyInfo?.locale ?? 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(converted)
  } catch {
    return `${converted.toFixed(2)} ${currencyCode}`
  }
}
