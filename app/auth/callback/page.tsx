"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Completing authentication...")

  useEffect(() => {
    const success = searchParams.get("success")
    const token = searchParams.get("token")
    const role = searchParams.get("role")
    const error = searchParams.get("error")

    if (success === "true" && token) {
      // Store the token
      localStorage.setItem("auth_token", token)
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
      setStatus("success")
      setMessage("Login successful! Redirecting...")

      // If this was opened as a popup, send message to opener
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "social-auth-callback",
            success: true,
            token,
            user: { role },
          },
          window.location.origin,
        )
        // Close the popup after a brief delay
        setTimeout(() => window.close(), 500)
      } else {
        // Direct navigation (no popup) — redirect normally
        setTimeout(() => {
          router.push(role === "admin" ? "/dashboard" : "/")
        }, 1000)
      }
    } else {
      setStatus("error")
      setMessage(error || "Authentication failed. Please try again.")

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "social-auth-callback",
            success: false,
            error: error || "Authentication failed",
          },
          window.location.origin,
        )
        setTimeout(() => window.close(), 2000)
      }
    }
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-12 shadow-sm">
        {status === "processing" && (
          <>
            <Loader2 className="size-10 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="size-10 text-red-500" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-2 text-sm text-accent hover:underline"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
