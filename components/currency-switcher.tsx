"use client"

import { CURRENCIES, type CurrencyCode } from "@/lib/currency/config"
import { useCurrency } from "@/lib/currency/context"
import { useTranslations } from "next-intl"

export function CurrencySwitcher() {
  const t = useTranslations("currency")
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          onClick={() => setCurrency(c.code)}
          className={`inline-flex h-6 min-w-[36px] items-center justify-center rounded-md px-1.5 text-[11px] font-medium transition-colors ${
            currency === c.code
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={t(c.code)}
        >
          {c.code}
        </button>
      ))}
    </div>
  )
}
