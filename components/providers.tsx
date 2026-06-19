"use client"

import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { ThemeProvider } from "next-themes"
import { store } from "@/lib/store"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </Provider>
  )
}