"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.ComponentProps<"select"> {
  error?: boolean
}

/**
 * A themed `<select>` wrapper that controls the native dropdown appearance
 * for dark mode compatibility. Uses `color-scheme` to make the native OS
 * dropdown popup use the correct theme.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          data-slot="select"
          className={cn(
            "h-9 w-full min-w-[140px] appearance-none rounded-lg border bg-background px-3 py-1.5 pr-8 text-sm text-foreground transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-card dark:text-foreground dark:border-border",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            className,
          )}
          style={{ colorScheme: "light dark" as React.CSSProperties["colorScheme"] }}
          {...props}
        >
          {children}
        </select>
        {/* Custom dropdown arrow that matches the theme */}
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </div>
    )
  },
)
Select.displayName = "Select"

export { Select }
