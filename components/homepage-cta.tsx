"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useTranslations } from "next-intl"

export function HomepageCta() {
  const t = useTranslations("home")
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for hydration so server and client renders match
  if (!mounted || loading || user) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance">
          {t("cta_title")}
        </h2>
        <p className="max-w-md text-pretty text-primary-foreground/80">
          {t("cta_description")}
        </p>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors mt-2"
        >
          {t("cta_create_account")}
        </Link>
      </div>
    </section>
  )
}
