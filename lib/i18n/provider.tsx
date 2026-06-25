"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"
import type { Locale } from "./config"
import { defaultLocale, getLocaleFromCookie, setLocaleCookie, localeDirections } from "./config"

interface LocaleContextValue {
  locale: Locale
  direction: "ltr" | "rtl"
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  direction: "ltr",
  setLocale: () => {},
})

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Record<string, any> | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load initial locale from cookie on mount
  useEffect(() => {
    const saved = getLocaleFromCookie()
    setLocaleState(saved)
    setMounted(true)
  }, [])

  // Load messages when locale changes
  useEffect(() => {
    async function loadMessages() {
      try {
        const msgs = await import(`../../messages/${locale}.json`)
        setMessages(msgs.default ?? msgs)
      } catch {
        // Fallback to English
        const msgs = await import(`../../messages/en.json`)
        setMessages(msgs.default ?? msgs)
      }
    }
    loadMessages()
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setLocaleCookie(newLocale)
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = localeDirections[newLocale]
    document.documentElement.lang = newLocale
  }, [])

  // Set initial direction on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = localeDirections[locale]
      document.documentElement.lang = locale
    }
  }, [mounted, locale])

  if (!mounted || !messages) {
    // Render children in default locale while loading
    return (
      <LocaleContext.Provider value={{ locale: defaultLocale, direction: "ltr", setLocale }}>
        <NextIntlClientProvider locale={defaultLocale} messages={{}} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      </LocaleContext.Provider>
    )
  }

  return (
    <LocaleContext.Provider value={{ locale, direction: localeDirections[locale], setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
