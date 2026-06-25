"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getDashboardStats, getFinancialDashboard } from "@/lib/api/services"
import type { DashboardStats, FinancialDashboardData } from "@/lib/types"

// ── Query key factories ─────────────────────────────────────────────
// Centralising keys makes invalidations consistent across the app.

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  financial: () => [...dashboardKeys.all, "financial"] as const,
}

// ── Hook: Dashboard Stats ───────────────────────────────────────────
//
// Stale time is set to 5 minutes to match the backend cache TTL.
// The data won't be older than what the server returns, and the
// client avoids unnecessary re-fetches within that window.

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000,       // 5 min — aligns with server cache
    gcTime: 10 * 60 * 1000,          // 10 min before GC
    refetchOnWindowFocus: false,      // handled by explicit polling
    retry: 1,
  })
}

// ── Hook: Financial Dashboard Data ──────────────────────────────────
//
// Stale time is set to 10 minutes to match the longer server cache.

export function useFinancialData() {
  return useQuery<FinancialDashboardData | null>({
    queryKey: dashboardKeys.financial(),
    queryFn: getFinancialDashboard,
    staleTime: 10 * 60 * 1000,       // 10 min — aligns with server cache
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// ── Hook: Polling wrapper (manual control) ──────────────────────────
//
// Returns stable memoized `refreshAll` / `refreshStats` / `refreshFinancial`
// functions that invalidate the query cache without showing the global
// loading state. Use these for auto-polling or the manual "Refresh" button.
//
// Because the returned functions are wrapped in useCallback they maintain
// referential stability across renders, preventing unnecessary
// setInterval / useEffect re-triggers in consumers.

export function useDashboardRefresh() {
  const queryClient = useQueryClient()

  const refreshAll = useCallback(() => {
    // Invalidate triggers a background refetch — existing data stays
    // visible while the new data loads, so the UI never flickers.
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }, [queryClient])

  const refreshStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() })
  }, [queryClient])

  const refreshFinancial = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.financial() })
  }, [queryClient])

  return { refreshAll, refreshStats, refreshFinancial }
}
