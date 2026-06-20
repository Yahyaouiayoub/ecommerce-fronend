"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/hooks/use-auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading, register } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/dashboard" : "/profile")
    }
  }, [user, loading, router])

  if (loading || user) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("password_confirmation") ?? "")
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    const firstName = String(form.get("first_name") ?? "")
    const lastName = String(form.get("last_name") ?? "")
    setSubmitting(true)
    try {
      const registeredUser = await register({
        first_name: firstName,
        last_name: lastName,
        email: String(form.get("email") ?? ""),
        password,
        password_confirmation: confirm,
      })
      toast.success("Account created!")
      router.push(registeredUser.role === "admin" ? "/dashboard" : "/profile")
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not create your account. Please try again."),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-muted-foreground">
          Join Lumen to track orders and check out faster.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" name="first_name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" name="last_name" required className="mt-1.5" />
          </div>
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
              minLength={8}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              required
              minLength={8}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting} className="mt-2">
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </SiteShell>
  )
}
