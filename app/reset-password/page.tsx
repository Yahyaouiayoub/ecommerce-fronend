"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StateMessage } from "@/components/state-message"
import { resetPassword } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const emailParam = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reset, setReset] = useState(false)

  useEffect(() => {
    if (emailParam) setEmail(emailParam)
  }, [emailParam])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setReset(true)
      toast.success("Password reset successfully!")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reset password. The link may have expired."))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Invalid reset link"
            description="This password reset link is missing the required token. Please request a new reset link."
            action={
              <Button asChild>
                <Link href="/forgot-password">Request new link</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    )
  }

  if (reset) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Password reset</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been reset successfully.
            </p>
            <Button asChild className="mt-6">
              <Link href="/login">Sign in with new password</Link>
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

        <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your new password below.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5"
              readOnly={!!emailParam}
            />
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="password_confirmation">Confirm new password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your password"
              className="mt-1.5"
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting || !password || !passwordConfirmation} className="mt-2">
            {submitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </SiteShell>
  )
}
