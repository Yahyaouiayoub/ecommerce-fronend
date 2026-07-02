"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import type { ProductReferences } from "@/lib/types"

interface DeleteProductModalProps {
  productName: string
  references: ProductReferences | null
  loading: boolean
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteProductModal({
  productName,
  references,
  loading,
  deleting,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, deleting])

  const hasReferences = references?.has_references ?? false
  const refs = references?.references

  // Build a human-readable list of reference types that have counts > 0
  const referenceLabels: { key: string; label: string; count: number }[] = refs
    ? [
        { key: "orders", label: "Orders", count: refs.orders },
        { key: "invoices", label: "Invoices", count: refs.invoices },
        { key: "reviews", label: "Reviews", count: refs.reviews },
        { key: "wishlists", label: "Wishlist", count: refs.wishlists },
        { key: "carts", label: "Shopping Carts", count: refs.carts },
        { key: "expenses", label: "Expenses", count: refs.expenses },
        { key: "coupons", label: "Coupons", count: refs.coupons },
      ].filter((r) => r.count > 0)
    : []

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current && !deleting) onClose()
      }}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-[92vw] max-w-lg rounded-xl border border-border bg-background p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-in fade-in-0 zoom-in-95"
    >
      <div className="relative p-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={deleting || loading}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" />
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-semibold tracking-tight">
          Delete Product
        </h2>

        {/* Product name */}
        <p className="mt-1 text-center text-sm text-muted-foreground">
          &ldquo;{productName}&rdquo;
        </p>

        {/* Loading references */}
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            Checking product references...
          </div>
        )}

        {/* Warning about references */}
        {!loading && hasReferences && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This product may already be referenced by:
            </p>
            <ul className="mt-2 space-y-1">
              {referenceLabels.map((r) => (
                <li key={r.key} className="flex items-center justify-between text-sm text-amber-700 dark:text-amber-400">
                  <span>{r.label}</span>
                  <span className="font-medium tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-500">
              Deleting this product may affect historical data and reporting.
            </p>
          </div>
        )}

        {/* General warning */}
        <div className="mt-4 space-y-2">
          <p className="text-center text-sm font-medium text-destructive">
            This action cannot be undone.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Are you sure you want to permanently delete this product?
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}
