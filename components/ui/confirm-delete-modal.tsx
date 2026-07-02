"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmDeleteModalProps {
  /** The title shown in the modal header (e.g. "Delete Brand") */
  title: string
  /** The name of the entity being deleted (e.g. "Summer Sale") */
  entityName: string
  /** Optional warning message explaining consequences */
  warning?: string
  loading: boolean
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteModal({
  title,
  entityName,
  warning,
  loading,
  deleting,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
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
          {title}
        </h2>

        {/* Entity name */}
        <p className="mt-1 text-center text-sm text-muted-foreground">
          &ldquo;{entityName}&rdquo;
        </p>

        {/* Loading */}
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            Checking references...
          </div>
        )}

        {/* Warning */}
        {!loading && warning && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {warning}
            </p>
          </div>
        )}

        {/* General warning */}
        <div className="mt-4 space-y-2">
          <p className="text-center text-sm font-medium text-destructive">
            This action cannot be undone.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Are you sure you want to permanently delete {entityName}?
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting || loading}
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
