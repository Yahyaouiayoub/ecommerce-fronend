export const locales = ["en", "fr", "ar", "es"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
  es: "Español",
}

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  ar: "🇲🇦",
  es: "🇪🇸",
}

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  ar: "rtl",
  es: "ltr",
}

const LOCALE_COOKIE = "NEXT_LOCALE"

export function getLocaleFromCookie(): Locale {
  if (typeof window === "undefined") return defaultLocale
  const match = document.cookie.match(new RegExp(`(^| )${LOCALE_COOKIE}=([^;]+)`))
  const value = match?.[2]
  if (value && locales.includes(value as Locale)) return value as Locale
  return defaultLocale
}

export function setLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
  // Also store in localStorage as fallback
  try {
    localStorage.setItem(LOCALE_COOKIE, locale)
  } catch {
    // ignore
  }
}
