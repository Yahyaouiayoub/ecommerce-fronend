"use client"

import { useState, useRef, useEffect } from "react"
import { Globe } from "lucide-react"
import { useLocale } from "@/lib/i18n/provider"
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n/config"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(l: Locale) {
    setLocale(l)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        aria-label="Switch language"
        title={localeNames[locale]}
      >
        <Globe className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-card py-1 shadow-lg">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                l === locale ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="text-base">{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
              {l === locale && (
                <span className="ml-auto text-xs text-accent">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
