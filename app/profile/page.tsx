"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, Package, User as UserIcon } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { updateProfile } from "@/lib/api/services"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout, setUser } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    try {
      const updated = await updateProfile({
        first_name: String(form.get("first_name") ?? ""),
        last_name: String(form.get("last_name") ?? ""),
        email: String(form.get("email") ?? ""),
      })
      setUser(updated)
      toast.success("Profile updated")
    } catch {
      toast.error("Could not update. Connect your API at PUT /auth/user.")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    toast.success("Signed out")
    router.push("/login")
  }

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim()
    : ""

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">My account</h1>

        {loading ? (
          <div className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !user ? (
          <div className="mt-8">
            <StateMessage
              icon={<UserIcon className="size-6" />}
              title="You're not signed in"
              description="Sign in to view and manage your account."
              action={
                <div className="flex gap-3">
                  <Link 
                    href="/login" 
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/register" 
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-lg font-semibold text-accent">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>

            <Link 
              href="/orders" 
              className="inline-flex h-8 items-center justify-between rounded-lg border border-border bg-background px-3 py-1 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Package className="size-4" />
                My orders
              </span>
              <span className="text-muted-foreground">View →</span>
            </Link>

            <form
              onSubmit={handleSave}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold">Profile details</h2>
              <Separator className="my-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={user.first_name}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={user.last_name}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="mt-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        )}
      </div>
    </SiteShell>
  )
}