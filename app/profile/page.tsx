"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, LogOut, Package, User as UserIcon, MapPin, Plus, Pencil, Trash2, Check } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { updateProfile, getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, type CreateAddressPayload } from "@/lib/api/services"
import type { Address } from "@/lib/types"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout, setUser } = useAuth()
  const [saving, setSaving] = useState(false)

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
          </div>
        )}
      </div>
    </SiteShell>
  )
}
