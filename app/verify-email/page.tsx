"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle2, AlertCircle, Loader2, Mail, RefreshCw } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { resendVerificationEmail, getVerificationStatus } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refresh } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [status, setStatus] = useState<"verifying" | "verified" | "error" | "idle">("verifying")
  const [message, setMessage] = useState("")

  // Get the full backend verification URL from the email link
  const verifyUrl = searchParams.get("url")

  useEffect(() => {
    if (!verifyUrl) {
      // No verification URL param — show the status/resend page
      setVerifying(false)
      setStatus("idle")
      checkCurrentStatus()
      return
    }

    async function doVerify() {
      if (!verifyUrl) return
      setVerifying(true)
      try {
        const res = await fetch(verifyUrl, {
          headers: { Accept: "application/json" },
        })
        const data = await res.json()

        if (res.ok) {
          setStatus("verified")
          setMessage(data.message ?? "Email verified successfully!")
          // Refresh user data to update verification status
          await refresh()
        } else {
          setStatus("error")
          setMessage(data.message ?? "Invalid or expired verification link.")
        }
      } catch {
        setStatus("error")
        setMessage("Could not connect to the server. Please try again.")
      } finally {
        setVerifying(false)
      }
    }

    doVerify()
  }, [verifyUrl])

  async function checkCurrentStatus() {
    try {
      await getVerificationStatus()
    } catch {
      // Not logged in or API error — ignore
    }
  }

  async function handleResend() {
    try {
      const res = await resendVerificationEmail()
      toast.success(res.message ?? "Verification email sent!")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send verification email."))
    }
  }

  // Verification URL is present — show verification result
  if (verifyUrl) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          {verifying && (
            <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
              <Loader2 className="size-8 animate-spin text-accent" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verifying your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">Please wait...</p>
            </div>
          )}

          {!verifying && status === "verified" && (
            <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Email verified!</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <Button asChild className="mt-6">
                <Link href={user?.role === "admin" ? "/dashboard" : "/profile"}>
                  Continue to your account
                </Link>
              </Button>
            </div>
          )}

          {!verifying && status === "error" && (
            <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verification failed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleResend} variant="outline" className="gap-1.5">
                  <RefreshCw className="size-4" />
                  Resend verification
                </Button>
                <Button asChild variant="default">
                  <Link href="/profile">Go to profile</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SiteShell>
    )
  }

  // No verification URL — show resend / status page
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
            <Mail className="size-6 text-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "We sent a verification link to your email. Please check your inbox."
              : "You need to be logged in to verify your email."}
          </p>

          {user && (
            <Button onClick={handleResend} variant="outline" className="mt-6 gap-1.5">
              <RefreshCw className="size-4" />
              Resend verification email
            </Button>
          )}

          {!user && (
            <Button asChild className="mt-6">
              <Link href="/login?redirect=/verify-email">Sign in</Link>
            </Button>
          )}

          {user && (
            <Button asChild variant="ghost" className="mt-3">
              <Link href="/profile">Go to profile</Link>
            </Button>
          )}
        </div>
      </div>
    </SiteShell>
  )
}
