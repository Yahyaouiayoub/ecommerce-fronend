"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPageRange } from "@/lib/pagination-utils"

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
  /** When true, renders a simpler prev/next style without numbered page buttons. Default false. */
  simple?: boolean
}

function GoToPageInput({ lastPage, onPageChange }: { lastPage: number; onPageChange: (page: number) => void }) {
  const [value, setValue] = useState("")

  function handleGo() {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= lastPage) {
      onPageChange(num)
    }
    setValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleGo()
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Go to</span>
      <input
        type="number"
        min={1}
        max={lastPage}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleGo}
        aria-label="Go to page"
        placeholder="..."
        className="h-8 w-14 rounded-lg border border-border bg-transparent px-2 text-center text-xs font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
      />
    </div>
  )
}

export function Pagination({ currentPage, lastPage, onPageChange, simple = false }: PaginationProps) {
  if (lastPage <= 1) return null

  if (simple) {
    return (
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {lastPage}
        </span>
        <GoToPageInput lastPage={lastPage} onPageChange={onPageChange} />
        <button
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage >= lastPage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    )
  }

  const pages = getPageRange(currentPage, lastPage)

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted-foreground select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <GoToPageInput lastPage={lastPage} onPageChange={onPageChange} />
      <button
        onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
        disabled={currentPage >= lastPage}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
