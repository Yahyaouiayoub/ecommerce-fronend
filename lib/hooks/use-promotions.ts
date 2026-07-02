"use client"

import { useSharedData } from "./use-api"
import { getActivePromotions } from "@/lib/api/services"
import type { ActivePromotionsResponse } from "@/lib/types"

/**
 * Hook to fetch and share active promotions across the application.
 * Uses the singleton data cache so that the navbar, homepage, and
 * any other component share the same network request and data.
 *
 * Promotions are cached for 3 minutes by default.
 */
export function useActivePromotions(staleTime: number = 60_000) {
  return useSharedData<ActivePromotionsResponse>(
    "activePromotions",
    getActivePromotions,
    staleTime,
  )
}
