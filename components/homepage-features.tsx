"use client"

import Link from "next/link"
import { getHomepageFeatures } from "@/lib/api/services"
import { useSharedData } from "@/lib/hooks/use-api"
import { getIconByKey } from "@/lib/icon-map"
import type { FeatureCard } from "@/lib/types"

/**
 * Fetches active homepage feature cards from the API and renders them
 * as a responsive grid. Automatically hides when no features exist.
 */
export function HomepageFeatures() {
  const { data: features, loading } = useSharedData<FeatureCard[]>(
    "homepageFeatures",
    getHomepageFeatures,
    5 * 60 * 1000, // 5 min stale time
  )

  // Don't render anything while loading or when there are no features
  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="size-10 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!features || features.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const IconComponent = getIconByKey(feature.icon_key)
          const card = (
            <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                {IconComponent ? (
                  <IconComponent className="size-5" />
                ) : (
                  <span className="text-lg font-bold">•</span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{feature.title}</h3>
                {feature.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                )}
              </div>
            </div>
          )

          if (feature.link_url) {
            return (
              <Link key={feature.id} href={feature.link_url} className="block">
                {card}
              </Link>
            )
          }

          return <div key={feature.id}>{card}</div>
        })}
      </div>
    </section>
  )
}
