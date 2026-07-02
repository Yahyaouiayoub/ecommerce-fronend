"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await forgotPassword({ email })
      setSent(true)
      toast.success("Check your email for the reset link.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Something went wrong. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="font-medium text-accent hover:underline"
              >
                try again
              </button>
              .
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/login">
                <ArrowLeft className="size-4 mr-1.5" />
                Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight">Forgot password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1.5"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting || !email} className="mt-2">
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </div>
    </SiteShell>
  )
}
