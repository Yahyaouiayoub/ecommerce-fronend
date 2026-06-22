"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, LogOut, Package, User as UserIcon, MapPin, Plus, Pencil, Trash2, Check, CreditCard, Clock, Shield } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { updateProfile, changePassword, getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, getPayments, getSessions, revokeSession, enableTwoFactor, confirmTwoFactor, disableTwoFactor, getTwoFactorStatus, regenerateRecoveryCodes, type CreateAddressPayload, type Session } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import type { Address, InvoicePayment } from "@/lib/types"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(true)
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [twoFactorQrUrl, setTwoFactorQrUrl] = useState("")
  const [twoFactorSetupCode, setTwoFactorSetupCode] = useState("")
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<"idle" | "generated" | "verified">("idle")
  const [twoFactorRecoveryCodes, setTwoFactorRecoveryCodes] = useState<string[]>([])
  const [twoFactorSetupSaving, setTwoFactorSetupSaving] = useState(false)
  const [showDisablePrompt, setShowDisablePrompt] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [twoFactorDisableSaving, setTwoFactorDisableSaving] = useState(false)

  // Session management state
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  // Payment history state
  const [payments, setPayments] = useState<InvoicePayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    label: "",
  })

  useEffect(() => {
    if (user) {
      getAddresses()
        .then(setAddresses)
        .catch(() => {})
        .finally(() => setLoadingAddresses(false))

      getPayments()
        .then(setPayments)
        .catch(() => {})
        .finally(() => setPaymentsLoading(false))

      getSessions()
        .then(setSessions)
        .catch(() => {})
        .finally(() => setSessionsLoading(false))

      getTwoFactorStatus()
        .then((res) => setTwoFactorEnabled(res.enabled))
        .catch(() => {})
        .finally(() => setTwoFactorLoading(false))
    }
  }, [user])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    try {
      const updated = await updateProfile({
        first_name: String(form.get("first_name") ?? ""),
        last_name: String(form.get("last_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
      })
      setUser(updated)
      toast.success("Profile updated")
    } catch {
      toast.error("Could not update profile.")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    toast.success("Signed out")
    router.push("/login")
  }

  function resetAddressForm() {
    setAddressForm({
      full_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      label: "",
    })
    setEditingAddress(null)
    setShowAddressForm(false)
  }

  function openEditAddress(address: Address) {
    setEditingAddress(address)
    setAddressForm({
      full_name: address.full_name,
      email: address.email ?? "",
      phone: address.phone ?? "",
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country,
      label: address.label ?? "",
    })
    setShowAddressForm(true)
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault()
    setSavingAddress(true)
    try {
      const payload: CreateAddressPayload = {
        full_name: addressForm.full_name,
        email: addressForm.email || undefined,
        phone: addressForm.phone || undefined,
        address_line1: addressForm.address_line1,
        address_line2: addressForm.address_line2 || undefined,
        city: addressForm.city,
        state: addressForm.state || undefined,
        postal_code: addressForm.postal_code || undefined,
        country: addressForm.country,
        label: addressForm.label || undefined,
        is_default: addresses.length === 0,
      }

      if (editingAddress) {
        const res = await updateAddress(editingAddress.id, payload)
        setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? res.address : a)))
        toast.success("Address updated")
      } else {
        const res = await createAddress(payload)
        setAddresses((prev) => [...prev, res.address])
        toast.success("Address added")
      }
      resetAddressForm()
    } catch {
      toast.error("Failed to save address")
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleDeleteAddress(id: number) {
    if (!confirm("Delete this address?")) return
    try {
      await deleteAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success("Address deleted")
    } catch {
      toast.error("Failed to delete address")
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await setDefaultAddress(id)
      setAddresses((prev) => prev.map((a) => ({
        ...a,
        is_default: a.id === id,
      })))
      toast.success("Default address updated")
    } catch {
      toast.error("Failed to set default address")
    }
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
            {/* Profile card */}
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

            {/* Quick links */}
            {user.role === "admin" && (
              <Link
                href="/dashboard"
                className="inline-flex h-8 items-center justify-between rounded-lg border border-border bg-accent/5 px-3 py-1 text-sm font-medium hover:bg-accent/10 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </span>
                <span className="text-muted-foreground">View →</span>
              </Link>
            )}
            {user.role === "client" && (
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
            )}

            {/* Profile form */}
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
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone ?? ""}
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

            {/* Last login & active sessions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <LogOut className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Login & sessions</h2>
              </div>
              <Separator className="my-4" />

              {/* Last login */}
              {user.last_login_at && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>
                    Last login:{" "}
                    {new Date(user.last_login_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {/* Active sessions */}
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Active sessions</h3>
              {sessionsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {session.name}
                          </span>
                          {session.is_current && (
                            <Badge variant="default" className="text-[10px] h-5">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Created{" "}
                          {new Date(session.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {!session.is_current && (
                        <button
                          onClick={async () => {
                            if (!confirm("Revoke this session? The device will be signed out.")) return
                            setRevokingId(session.id)
                            try {
                              await revokeSession(session.id)
                              setSessions((prev) => prev.filter((s) => s.id !== session.id))
                              toast.success("Session revoked.")
                            } catch {
                              toast.error("Failed to revoke session.")
                            } finally {
                              setRevokingId(null)
                            }
                          }}
                          disabled={revokingId === session.id}
                          className="inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          {revokingId === session.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two-factor authentication */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Two-factor authentication</h2>
              </div>
              <Separator className="my-4" />

              {twoFactorLoading ? (
                <Skeleton className="h-12 w-full rounded-lg" />
              ) : twoFactorEnabled ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">Two-factor authentication is active</span>
                  </div>

                  {/* Recovery codes */}
                  {twoFactorRecoveryCodes.length > 0 && (
                    <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium mb-2">Recovery codes</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Each code can be used once if you lose access to your authenticator app.
                      </p>
                      <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                        {twoFactorRecoveryCodes.map((code, i) => (
                          <div key={i} className="truncate">{code}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const pw = prompt("Enter your current password to regenerate recovery codes:")
                        if (!pw) return
                        try {
                          const res = await regenerateRecoveryCodes(pw)
                          setTwoFactorRecoveryCodes(res.recovery_codes)
                          toast.success("Recovery codes regenerated.")
                        } catch (err) {
                          toast.error(getApiErrorMessage(err, "Failed to regenerate codes."))
                        }
                      }}
                    >
                      Regenerate codes
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowDisablePrompt(true)}
                    >
                      Disable 2FA
                    </Button>
                  </div>

                  {/* Disable 2FA confirmation */}
                  {showDisablePrompt && (
                    <div className="mt-4 flex items-center gap-3">
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        className="max-w-64"
                        autoFocus
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={twoFactorDisableSaving || !disablePassword}
                        onClick={async () => {
                          setTwoFactorDisableSaving(true)
                          try {
                            await disableTwoFactor(disablePassword)
                            setTwoFactorEnabled(false)
                            setTwoFactorRecoveryCodes([])
                            setShowDisablePrompt(false)
                            setDisablePassword("")
                            toast.success("Two-factor authentication disabled.")
                          } catch (err) {
                            toast.error(getApiErrorMessage(err, "Failed to disable 2FA."))
                          } finally {
                            setTwoFactorDisableSaving(false)
                          }
                        }}
                      >
                        {twoFactorDisableSaving ? "Disabling..." : "Confirm"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowDisablePrompt(false); setDisablePassword(""); setTwoFactorDisableSaving(false) }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </>
              ) : twoFactorSetupStep === "idle" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                    You'll need an authenticator app like Google Authenticator or Authy.
                  </p>
                  <Button
                    onClick={async () => {
                      setTwoFactorSetupSaving(true)
                      try {
                        const res = await enableTwoFactor()
                        setTwoFactorSecret(res.secret ?? "")
                        setTwoFactorQrUrl(res.qr_code_url ?? "")
                        setTwoFactorSetupStep("generated")
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, "Failed to start 2FA setup."))
                      } finally {
                        setTwoFactorSetupSaving(false)
                      }
                    }}
                    disabled={twoFactorSetupSaving}
                  >
                    {twoFactorSetupSaving ? "Setting up..." : "Set up two-factor authentication"}
                  </Button>
                </>
              ) : twoFactorSetupStep === "generated" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan this QR code with your authenticator app, then enter the 6-digit code below to verify.
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="rounded-xl border border-border bg-white p-4">
                      {twoFactorQrUrl ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorQrUrl)}`}
                          alt="QR Code for 2FA setup"
                          width={200}
                          height={200}
                          className="rounded-lg"
                        />
                      ) : null}
                    </div>
                  </div>

                  {twoFactorSecret && (
                    <p className="text-center text-xs text-muted-foreground mb-4">
                      Can't scan? Manually enter this key:{" "}
                      <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">{twoFactorSecret}</code>
                    </p>
                  )}

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor="2fa_verify_code">Verification code</Label>
                      <Input
                        id="2fa_verify_code"
                        value={twoFactorSetupCode}
                        onChange={(e) => setTwoFactorSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="mt-1.5 text-center text-lg tracking-widest"
                        autoFocus
                      />
                    </div>
                    <Button
                      disabled={twoFactorSetupCode.length !== 6 || twoFactorSetupSaving}
                      onClick={async () => {
                        setTwoFactorSetupSaving(true)
                        try {
                          const res = await confirmTwoFactor(twoFactorSetupCode)
                          setTwoFactorEnabled(true)
                          setTwoFactorRecoveryCodes(res.recovery_codes)
                          setTwoFactorSetupStep("verified")
                          toast.success(res.message)
                        } catch (err) {
                          toast.error(getApiErrorMessage(err, "Invalid code. Try again."))
                        } finally {
                          setTwoFactorSetupSaving(false)
                        }
                      }}
                    >
                      {twoFactorSetupSaving ? "Verifying..." : "Verify & enable"}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setTwoFactorSetupStep("idle")}
                  >
                    Cancel setup
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-4">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">Two-factor authentication is now active</span>
                  </div>

                  {/* Show recovery codes once after setup */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20 mb-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                      Save these recovery codes
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                      Each code can be used once to sign in if you lose access to your authenticator app.
                      Store them somewhere safe.
                    </p>
                    <div className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-900 dark:text-amber-200">
                      {twoFactorRecoveryCodes.map((code, i) => (
                        <div key={i}>{code}</div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTwoFactorSetupStep("idle")}
                  >
                    Got it
                  </Button>
                </>
              )}
            </div>

            {/* Change password */}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (passwordSaving) return

                const form = new FormData(e.currentTarget)
                const current_password = String(form.get("current_password") ?? "")
                const new_password = String(form.get("new_password") ?? "")
                const new_password_confirmation = String(form.get("new_password_confirmation") ?? "")

                if (!current_password || !new_password || !new_password_confirmation) {
                  toast.error("Please fill in all password fields.")
                  return
                }
                if (new_password.length < 8) {
                  toast.error("New password must be at least 8 characters.")
                  return
                }
                if (new_password !== new_password_confirmation) {
                  toast.error("New passwords do not match.")
                  return
                }

                setPasswordSaving(true)
                try {
                  await changePassword({ current_password, new_password, new_password_confirmation })
                  toast.success("Password changed successfully.")
                  e.currentTarget.reset()
                } catch (err: unknown) {
                  toast.error(getApiErrorMessage(err, "Failed to change password."))
                } finally {
                  setPasswordSaving(false)
                }
              }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold">Change password</h2>
              <Separator className="my-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="current_password">Current password</Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new_password_confirmation">Confirm new password</Label>
                  <Input
                    id="new_password_confirmation"
                    name="new_password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
            </form>

            {/* Addresses section */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">My addresses</h2>
                </div>
                {!showAddressForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="size-4 mr-1" />
                    Add address
                  </Button>
                )}
              </div>
              <Separator className="my-4" />

              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="mb-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {editingAddress ? "Edit address" : "New address"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="addr_full_name">Full name *</Label>
                      <Input id="addr_full_name" value={addressForm.full_name} onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_email">Email</Label>
                      <Input id="addr_email" type="email" value={addressForm.email} onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_phone">Phone</Label>
                      <Input id="addr_phone" type="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="addr_line1">Street address *</Label>
                      <Input id="addr_line1" value={addressForm.address_line1} onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })} required className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="addr_line2">Apt, suite, etc. (optional)</Label>
                      <Input id="addr_line2" value={addressForm.address_line2} onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_city">City *</Label>
                      <Input id="addr_city" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_state">State</Label>
                      <Input id="addr_state" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_postal_code">Postal code</Label>
                      <Input id="addr_postal_code" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="addr_country">Country *</Label>
                      <Input id="addr_country" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} required className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="addr_label">Label (e.g. Home, Work)</Label>
                      <Input id="addr_label" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="Home" className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={savingAddress}>
                      {savingAddress ? "Saving..." : editingAddress ? "Update address" : "Save address"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetAddressForm}>Cancel</Button>
                  </div>
                </form>
              )}

              {loadingAddresses ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start justify-between rounded-lg border border-border bg-background p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.full_name}</p>
                          {addr.is_default && (
                            <Badge variant="default" className="text-[10px] h-5">Default</Badge>
                          )}
                          {addr.label && (
                            <span className="text-xs text-muted-foreground">({addr.label})</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{addr.address_line1}</p>
                        {addr.address_line2 && (
                          <p className="text-sm text-muted-foreground">{addr.address_line2}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {addr.city}, {addr.state ? `${addr.state}, ` : ""}{addr.country} {addr.postal_code ?? ""}
                        </p>
                        {(addr.email || addr.phone) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {addr.email}{addr.email && addr.phone ? " · " : ""}{addr.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-start gap-1 ml-4 shrink-0">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                            title="Set as default"
                          >
                            <Check className="size-3.5 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditAddress(addr)}
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Payment History</h2>
              </div>
              <Separator className="my-4" />

              {paymentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.slice(0, 10).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {payment.payment_type_label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : new Date(payment.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="font-semibold text-sm">
                          {payment.amount_formatted}
                        </span>
                        <Badge
                          variant={
                            payment.status === "paid"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] h-5"
                        >
                          {payment.status_label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  )
}
