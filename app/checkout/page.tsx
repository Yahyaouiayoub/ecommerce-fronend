"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShoppingBag, Plus, MapPin, Check, ChevronDown, Pencil, Trash2, User } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { OrderSummary } from "@/components/order-summary"
import { StateMessage } from "@/components/state-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import {
  useAppDispatch,
  useAppSelector,
  selectCartItems,
} from "@/lib/store"
import { clearCart } from "@/lib/store/cart-slice"
import { createOrder, getAddresses, createAddress, updateAddress, deleteAddress, type CheckoutPayload } from "@/lib/api/services"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Address } from "@/lib/types"
import { toast } from "sonner"

const PAYMENT_METHODS = [
  { value: "card", label: "Credit / Debit card" },
  { value: "cod", label: "Cash on delivery" },
]

export default function CheckoutPage() {
  const items = useAppSelector(selectCartItems)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [payment, setPayment] = useState("cod")

  // Authenticated user: address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)

  // Guest: shipping info form
  const [guestForm, setGuestForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  })

  // New address form (for authenticated users adding new address during checkout)
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

  // Load addresses for authenticated users
  useEffect(() => {
    if (user) {
      getAddresses()
        .then((addrs) => {
          setAddresses(addrs)
          const defaultAddr = addrs.find((a) => a.is_default) ?? addrs[0]
          if (defaultAddr) setSelectedAddressId(defaultAddr.id)
        })
        .catch(() => {
          toast.error("Could not load saved addresses")
        })
        .finally(() => setLoadingAddresses(false))
    }
  }, [user])

  // Pre-fill guest email from auth user
  useEffect(() => {
    if (user && user.email) {
      setGuestForm((prev) => ({ ...prev, guest_email: user.email, guest_name: user.full_name ?? "" }))
    }
  }, [user])



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
      const payload = {
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
        setSelectedAddressId(res.address.id)
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
      if (selectedAddressId === id) {
        const remaining = addresses.filter((a) => a.id !== id)
        setSelectedAddressId(remaining[0]?.id ?? null)
      }
      toast.success("Address deleted")
    } catch {
      toast.error("Failed to delete address")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (user && !selectedAddressId) {
      toast.error("Please select or add a shipping address")
      return
    }

    if (!user) {
      // Validate guest form
      if (!guestForm.guest_name || !guestForm.guest_email || !guestForm.address_line1 || !guestForm.city || !guestForm.country) {
        toast.error("Please fill in all required shipping fields")
        return
      }
    }

    setSubmitting(true)
    try {
      let payload: CheckoutPayload

      if (user) {
        payload = {
          payment_method: payment,
          address_id: selectedAddressId!,
        }
      } else {
        payload = {
          payment_method: payment,
          guest_name: guestForm.guest_name,
          guest_email: guestForm.guest_email,
          guest_phone: guestForm.guest_phone || undefined,
          address_line1: guestForm.address_line1,
          address_line2: guestForm.address_line2 || undefined,
          city: guestForm.city,
          state: guestForm.state || undefined,
          postal_code: guestForm.postal_code || undefined,
          country: guestForm.country,
        }
      }

      const order = await createOrder(payload)
      dispatch(clearCart())
      toast.success("Order placed successfully")
      router.push(`/order-confirmation/${order.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not place order. Please try again."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return null

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <div className="mt-8">
            <StateMessage
              icon={<ShoppingBag className="size-6" />}
              title="Your cart is empty"
              description="Add some products before checking out."
              action={
                <Button asChild>
                  <Link href="/products">Browse products</Link>
                </Button>
              }
            />
          </div>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-3"
        >
          {/* Details */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Shipping Address */}
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {user ? "Shipping address" : "Shipping information"}
                </h2>
              </div>

              {user ? (
                /* ─── AUTHENTICATED USER FLOW ─── */
                <>
                  {!showAddressForm && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="size-4 mr-1" />
                        Add new
                      </Button>
                    </div>
                  )}

                  {loadingAddresses ? (
                    <div className="mt-4 space-y-3">
                      <div className="h-16 animate-pulse rounded-lg bg-muted" />
                      <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    </div>
                  ) : showAddressForm ? (
                    /* Address Form */
                    <div className="mt-4 space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {editingAddress ? "Edit address" : "New address"}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor="addr_full_name">Full name *</Label>
                          <Input
                            id="addr_full_name"
                            value={addressForm.full_name}
                            onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                            required
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_email">Email</Label>
                          <Input
                            id="addr_email"
                            type="email"
                            value={addressForm.email}
                            onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_phone">Phone</Label>
                          <Input
                            id="addr_phone"
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="addr_line1">Street address *</Label>
                          <Input
                            id="addr_line1"
                            value={addressForm.address_line1}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                            required
                            className="mt-1.5"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="addr_line2">Apt, suite, etc. (optional)</Label>
                          <Input
                            id="addr_line2"
                            value={addressForm.address_line2}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_city">City *</Label>
                          <Input
                            id="addr_city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_state">State</Label>
                          <Input
                            id="addr_state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_postal_code">Postal code</Label>
                          <Input
                            id="addr_postal_code"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr_country">Country *</Label>
                          <Input
                            id="addr_country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            required
                            className="mt-1.5"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor="addr_label">Label (e.g. Home, Work)</Label>
                          <Input
                            id="addr_label"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            placeholder="Home"
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={handleSaveAddress} disabled={savingAddress}>
                          {savingAddress ? "Saving..." : editingAddress ? "Update address" : "Save address"}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetAddressForm}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : addresses.length > 0 ? (
                    /* Address Selection */
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              {(() => {
                                const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
                                return selectedAddress ? (
                                  <>
                                    <p className="font-medium truncate">{selectedAddress.full_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.country}
                                      {selectedAddress.label && ` — ${selectedAddress.label}`}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">Select an address</p>
                                )
                              })()}
                            </div>
                          </div>
                          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${showAddressDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showAddressDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowAddressDropdown(false)} />
                            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-card shadow-lg">
                              {addresses.map((addr) => (
                                <div
                                  key={addr.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedAddressId(addr.id)
                                    setShowAddressDropdown(false)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      setSelectedAddressId(addr.id)
                                      setShowAddressDropdown(false)
                                    }
                                  }}
                                  className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg cursor-pointer ${
                                    addr.id === selectedAddressId ? "bg-accent/5" : ""
                                  }`}
                                >
                                  <div className="flex size-5 shrink-0 items-center justify-center mt-0.5">
                                    {addr.id === selectedAddressId ? (
                                      <Check className="size-4 text-accent" />
                                    ) : (
                                      <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{addr.full_name}</p>
                                      {addr.is_default && (
                                        <span className="text-[10px] rounded-full bg-accent/10 text-accent px-1.5 py-0.5 font-medium">
                                          Default
                                        </span>
                                      )}
                                      {addr.label && (
                                        <span className="text-[10px] text-muted-foreground">({addr.label})</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {addr.address_line1}
                                      {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {addr.city}, {addr.state ? `${addr.state}, ` : ""}{addr.country} {addr.postal_code ?? ""}
                                    </p>
                                    {(addr.email || addr.phone) && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {addr.email}{addr.email && addr.phone ? " · " : ""}{addr.phone}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditAddress(addr)
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation()
                                          openEditAddress(addr)
                                        }
                                      }}
                                      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
                                    >
                                      <Pencil className="size-3.5 text-muted-foreground" />
                                    </div>
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteAddress(addr.id)
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation()
                                          handleDeleteAddress(addr.id)
                                        }
                                      }}
                                      className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5 text-destructive" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        No saved addresses. Click &quot;Add new&quot; to add one.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="size-4 mr-1" />
                        Add new address
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                /* ─── GUEST CHECKOUT FLOW ─── */
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="size-4" />
                    <span>Checkout as guest. <Link href="/login?redirect=/checkout" className="text-accent hover:underline">Sign in</Link> to use saved addresses.</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="guest_name">Full name *</Label>
                      <Input
                        id="guest_name"
                        value={guestForm.guest_name}
                        onChange={(e) => setGuestForm({ ...guestForm, guest_name: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_email">Email *</Label>
                      <Input
                        id="guest_email"
                        type="email"
                        value={guestForm.guest_email}
                        onChange={(e) => setGuestForm({ ...guestForm, guest_email: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Phone</Label>
                      <Input
                        id="guest_phone"
                        type="tel"
                        value={guestForm.guest_phone}
                        onChange={(e) => setGuestForm({ ...guestForm, guest_phone: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="guest_addr1">Street address *</Label>
                      <Input
                        id="guest_addr1"
                        value={guestForm.address_line1}
                        onChange={(e) => setGuestForm({ ...guestForm, address_line1: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="guest_addr2">Apt, suite, etc. (optional)</Label>
                      <Input
                        id="guest_addr2"
                        value={guestForm.address_line2}
                        onChange={(e) => setGuestForm({ ...guestForm, address_line2: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_city">City *</Label>
                      <Input
                        id="guest_city"
                        value={guestForm.city}
                        onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_state">State</Label>
                      <Input
                        id="guest_state"
                        value={guestForm.state}
                        onChange={(e) => setGuestForm({ ...guestForm, state: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_postal">Postal code</Label>
                      <Input
                        id="guest_postal"
                        value={guestForm.postal_code}
                        onChange={(e) => setGuestForm({ ...guestForm, postal_code: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_country">Country *</Label>
                      <Input
                        id="guest_country"
                        value={guestForm.country}
                        onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Payment method */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <div className="mt-4 flex flex-col gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.value}
                      checked={payment === method.value}
                      onChange={() => setPayment(method.value)}
                      className="accent-accent"
                    />
                    {method.label}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Payment is processed securely by your Laravel backend.
              </p>
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <OrderSummary>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || (!!user && !selectedAddressId)}
              >
                {submitting ? "Placing order..." : "Place order"}
              </Button>
            </OrderSummary>

            <Separator className="my-6" />
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-muted-foreground"
                >
                  <span className="line-clamp-1">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </SiteShell>
  )
}
