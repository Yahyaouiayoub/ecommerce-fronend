"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Shield } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/use-auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login, verify2FA } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    challenge_token: string
    email: string
  } | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/dashboard" : "/profile")
    }
  }, [user, loading, router])

  if (loading || user) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    setSubmitting(true)
    try {
      const result = await login({ email, password })

      if (result.two_factor_required && result.challenge_token) {
        setTwoFactorChallenge({ challenge_token: result.challenge_token, email })
        return
      }

      toast.success("Welcome back!")
      router.push(result.user.role === "admin" ? "/dashboard" : "/profile")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid email or password."))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault()
    if (!twoFactorChallenge) return
    if (twoFactorCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.")
      return
    }
    setVerifying(true)
    try {
      const verifiedUser = await verify2FA(twoFactorChallenge.challenge_token, twoFactorCode)
      toast.success("Welcome back!")
      router.push(verifiedUser.role === "admin" ? "/dashboard" : "/profile")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid verification code."))
    } finally {
      setVerifying(false)
    }
  }

  // 2FA challenge step
  if (twoFactorChallenge) {
    return (
      <SiteShell>
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <button
            onClick={() => setTwoFactorChallenge(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="size-6 text-accent" />
            <h1 className="text-3xl font-semibold tracking-tight">Two-factor authentication</h1>
          </div>
          <p className="text-muted-foreground">
            Enter the 6-digit code from your authenticator app{" "}
            {twoFactorChallenge.email && (
              <span>for <strong>{twoFactorChallenge.email}</strong></span>
            )}
            .
          </p>

          <form
            onSubmit={handleVerify2FA}
            className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
          >
            <div>
              <Label htmlFor="2fa_code">Authentication code</Label>
              <Input
                id="2fa_code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="mt-1.5 text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" disabled={verifying || twoFactorCode.length !== 6} className="mt-2">
              {verifying ? "Verifying..." : "Verify & sign in"}
            </Button>
          </form>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back. Enter your details to continue.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1.5"
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting} className="mt-2">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </SiteShell>
  )
}
