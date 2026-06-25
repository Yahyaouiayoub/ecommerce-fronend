"use client"

import { useRef, type ReactNode } from "react"
import { Provider } from "react-redux"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { ThemeProvider } from "next-themes"
import { store } from "@/lib/store"
import { Toaster } from "@/components/ui/sonner"
import { I18nProvider } from "@/lib/i18n/provider"
import { CurrencyProvider } from "@/lib/currency/context"

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
  { ssr: false },
)

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dashboard data doesn't change often — keep stale for 2 minutes
        staleTime: 2 * 60 * 1000,
        // Cache responses for 10 minutes before GC
        gcTime: 10 * 60 * 1000,
        // Don't refetch when the window regains focus (already handled by polling)
        refetchOnWindowFocus: false,
        // Retry once on failure
        retry: 1,
        // Use a shorter stale time for initial load to show fresh data fast
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return makeQueryClient()
  }
  // Browser: reuse the same QueryClient across renders
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useRef(getQueryClient()).current

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </I18nProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </Provider>
      {/* Only load React Query Devtools in development — tree-shaken in production */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}