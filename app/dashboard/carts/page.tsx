"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useRef } from "react"
import {
  AlertCircle,
  ShoppingBag,
  Search,
  X,
  Trash2,
  User,
  Clock,
  Package,
  Ban,
  Mail,
  Filter,
  Hash,
  Calendar,
  Globe,
  Phone,
  MapPin,
  UserPlus,
  Check,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { adminGetCarts, adminMarkCartAbandoned, adminDeleteCart, adminConvertCartToUser, adminGetUsers } from "@/lib/api/services"
import { formatPrice } from "@/lib/utils"
import { getApiErrorMessage, getImageUrl } from "@/lib/api/client"
import type { AdminCart, User as UserType } from "@/lib/types"
import { toast } from "sonner"

const cartStatusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  abandoned: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  converted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
}

const cartStatusIcons: Record<string, typeof ShoppingBag> = {
  active: ShoppingBag,
  abandoned: Ban,
  converted: Package,
}

export default function AdminCartsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Filters
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [statusFilter, search, dateFrom, dateTo])

  const { data, loading, error, reload } = useApi<AdminCart[]>(
    () => adminGetCarts(Object.keys(queryParams).length > 0 ? queryParams : undefined),
    [queryParams],
  )

  const [deletingKeys, setDeletingKeys] = useState<string[]>([])
  const [abandoningKeys, setAbandoningKeys] = useState<string[]>([])
  const [selectedCart, setSelectedCart] = useState<AdminCart | null>(null)
  const [convertingKey, setConvertingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  async function handleMarkAbandoned(ownerKey: string, notify?: boolean) {
    setAbandoningKeys((prev) => [...prev, ownerKey])
    try {
      const result = await adminMarkCartAbandoned(ownerKey, notify)
      toast.success(result.message)
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark cart as abandoned"))
    } finally {
      setAbandoningKeys((prev) => prev.filter((k) => k !== ownerKey))
    }
  }

  async function handleDelete(ownerKey: string) {
    if (!confirm("Delete this cart permanently? This action cannot be undone.")) return
    setDeletingKeys((prev) => [...prev, ownerKey])
    try {
      await adminDeleteCart(ownerKey)
      toast.success("Cart deleted")
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete cart"))
    } finally {
      setDeletingKeys((prev) => prev.filter((k) => k !== ownerKey))
    }
  }

  async function handleConvertToUser(ownerKey: string, userId: number) {
    setConvertingKey(ownerKey)
    try {
      const result = await adminConvertCartToUser(ownerKey, userId)
      toast.success(result.message)
      setSelectedCart(null)
      reload()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to convert cart"))
    } finally {
      setConvertingKey(null)
    }
  }

  const clearFilters = () => {
    setStatusFilter("")
    setSearch("")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = statusFilter || search || dateFrom || dateTo

  if (authLoading) return null

  const displayCarts = data ?? []

  return (
    <>
      {/* Cart Detail Drawer */}
      <Sheet open={!!selectedCart} onOpenChange={(open) => { if (!open) setSelectedCart(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl">
          {selectedCart && <CartDetailDrawerContent cart={selectedCart} onMarkAbandoned={handleMarkAbandoned} onDelete={handleDelete} onConvert={handleConvertToUser} onClose={() => setSelectedCart(null)} converting={convertingKey === selectedCart.id} />}
        </SheetContent>
      </Sheet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Carts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data ? `${data.length} cart${data.length !== 1 ? "s" : ""}` : "Monitor active shopping carts"}
              {hasActiveFilters && data && ` — filtered`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="size-4" />
              Filters
              {hasActiveFilters && <span className="ml-1.5 size-1.5 rounded-full bg-accent" />}
            </Button>
            <Button variant="outline" onClick={reload}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-32 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="converted">Converted (checked out)</option>
                </Select>
              </div>
              <div className="min-w-40 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name, email, session..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <StateMessage
            icon={<AlertCircle className="size-6" />}
            title="Couldn't load carts"
            action={<Button onClick={reload} variant="outline">Try again</Button>}
          />
        ) : displayCarts.length === 0 ? (
          <StateMessage
            icon={<ShoppingBag className="size-6" />}
            title="No carts found"
            description={hasActiveFilters ? "Try adjusting your filters." : "No active shopping carts right now."}
            action={hasActiveFilters ? <Button onClick={clearFilters} variant="outline">Clear filters</Button> : undefined}
          />          ) : (
          <>
            {/* Active carts section */}
            {displayCarts.filter((c) => c.status === "active").length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Active carts ({displayCarts.filter((c) => c.status === "active").length})
                </h2>
                <div className="space-y-3">
                  {displayCarts
                    .filter((c) => c.status === "active")
                    .map((cart) => renderCartCard(cart))}
                </div>
              </div>
            )}

            {/* Other carts */}
            {displayCarts.filter((c) => c.status !== "active").length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {displayCarts.filter((c) => c.status === "active").length > 0
                    ? "Converted & abandoned"
                    : "All carts"} ({displayCarts.filter((c) => c.status !== "active").length})
                </h2>
                <div className="space-y-2">
                  {displayCarts
                    .filter((c) => c.status !== "active")
                    .map((cart) => renderCartCard(cart, true))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )

  function renderCartCard(cart: AdminCart, compact = false) {
    const StatusIcon = cartStatusIcons[cart.status] ?? ShoppingBag
    const isUpdating = abandoningKeys.includes(cart.id) || deletingKeys.includes(cart.id)

    return (
      <div
        key={cart.id}
        className={`group cursor-pointer rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-accent/30 ${
          compact ? "py-3" : "py-4"
        }`}
        onClick={() => setSelectedCart(cart)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedCart(cart) }}
      >
        <div className="px-4">
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <StatusIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">
                    {cart.user ? (
                      <>{cart.user.full_name ?? `${cart.user.first_name} ${cart.user.last_name}`}</>
                    ) : (
                      <>Guest</>
                    )}
                  </span>
                  <Badge className={cartStatusStyles[cart.status] ?? ""}>
                    {cart.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="size-3" />
                  {cart.updated_at
                    ? new Date(cart.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-base font-semibold">{formatPrice(cart.total_value)}</p>
                <p className="text-xs text-muted-foreground">{cart.item_count} item{cart.item_count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Middle row */}
          {!compact && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium truncate">
                  {cart.user ? (
                    <>{cart.user.full_name ?? `${cart.user.first_name} ${cart.user.last_name}`}</>
                  ) : (
                    "Guest"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:justify-end">
                <Package className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{cart.items.length} product{cart.items.length !== 1 ? "s" : ""}</span>
                {cart.session_id && !cart.user && (
                  <span className="text-xs text-muted-foreground hidden sm:inline" title={cart.session_id}>
                    (guest session)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Items preview */}
          {!compact && cart.items.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex flex-wrap gap-2">
                {cart.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs"
                  >
                    <span className="font-medium truncate max-w-28">{item.product?.name ?? `#${item.product_id}`}</span>
                    <span className="text-muted-foreground">×{item.quantity}</span>
                    <span className="text-muted-foreground">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
                {cart.items.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{cart.items.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bottom row: contact + actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              {cart.user?.email ? (
                <a
                  href={`mailto:${cart.user.email}`}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Mail className="size-3" />
                  Email
                </a>
              ) : null}
              {cart.status === "active" && (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => handleMarkAbandoned(cart.id)}
                >
                  {abandoningKeys.includes(cart.id) ? "..." : "Mark abandoned"}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="destructive"
                disabled={isUpdating}
                onClick={() => handleDelete(cart.id)}
              >
                {deletingKeys.includes(cart.id) ? "..." : <Trash2 className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// =========================
// CART DETAIL DRAWER COMPONENT
// =========================

interface CartDetailDrawerContentProps {
  cart: AdminCart
  onMarkAbandoned: (ownerKey: string) => void
  onDelete: (ownerKey: string) => void
  onConvert: (ownerKey: string, userId: number) => void
  onClose: () => void
  converting: boolean
}

function CartDetailDrawerContent({ cart, onMarkAbandoned, onDelete, onConvert, onClose, converting }: CartDetailDrawerContentProps) {
  const StatusIcon = cartStatusIcons[cart.status] ?? ShoppingBag

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const customerName = cart.user
    ? cart.user.full_name ?? `${cart.user.first_name} ${cart.user.last_name}`
    : "Guest"

  return (
    <>
      {/* Header */}
      <SheetHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <StatusIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate">{customerName}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 mt-0.5">
              <Badge className={cartStatusStyles[cart.status] ?? ""}>
                {cart.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {cart.item_count} item{cart.item_count !== 1 ? "s" : ""}
              </span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Customer Info Card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Customer Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium truncate">{customerName}</span>
            </div>
            {cart.user?.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Email:</span>
                <a href={`mailto:${cart.user.email}`} className="font-medium text-accent hover:underline truncate">
                  {cart.user.email}
                </a>
              </div>
            )}
            {cart.user?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{cart.user.phone}</span>
              </div>
            )}
            {cart.user?.address && (
              <div className="flex items-start gap-2">
                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{cart.user.address}{cart.user.city ? `, ${cart.user.city}` : ""}{cart.user.country ? `, ${cart.user.country}` : ""}</span>
              </div>
            )}
            {cart.session_id && !cart.user && (
              <div className="flex items-center gap-2">
                <Globe className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Session:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono truncate" title={cart.session_id}>
                  {cart.session_id.slice(0, 16)}...
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Cart Status & Dates */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Cart ID:</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {cart.id}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDateTime(cart.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Updated:</span>
              <span className="font-medium">{formatDateTime(cart.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Cart Items Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cart Items ({cart.items.length})
            </h4>
            <span className="text-sm font-semibold">{formatPrice(cart.total_value)} total</span>
          </div>

          <div className="space-y-2">
            {cart.items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  {/* Product image */}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {item.product?.thumbnail ? (
                      <img
                        src={getImageUrl(item.product.thumbnail)}
                        alt={item.product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Package className="size-5" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product?.name ?? `Product #${item.product_id}`}
                        </p>
                        {item.product?.sku && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SKU: {item.product.sku}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap shrink-0">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatPrice(item.price)} × {item.quantity}
                      </span>
                      {item.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(item.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Stock indicator */}
                    {item.product && (
                      <div className="mt-1.5">
                        {item.product.stock > 0 ? (
                          <span className={`text-xs ${item.product.stock < item.quantity ? "text-red-500 font-medium" : "text-emerald-600"}`}>
                            {item.product.stock < item.quantity
                              ? `⚠ Only ${item.product.stock} in stock`
                              : `${item.product.stock} in stock`}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">Out of stock</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="text-lg font-semibold mt-0.5">{cart.item_count}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold mt-0.5">{formatPrice(cart.total_value)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cart.user && cart.user.email && (
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <a href={`mailto:${cart.user.email}`}>
                <Mail className="size-3.5" />
                Email
              </a>
            </Button>
          )}
          {!cart.user && cart.status === "active" && (
            <ConvertToUserButton ownerKey={cart.id} onConvert={onConvert} converting={converting} />
          )}
          {cart.status === "active" && (
            <AbandonWithNotifyButton ownerKey={cart.id} onMarkAbandoned={onMarkAbandoned} onClose={onClose} />
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onClose()
              onDelete(cart.id)
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </>
  )
}

function AbandonWithNotifyButton({ ownerKey, onMarkAbandoned, onClose }: { ownerKey: string; onMarkAbandoned: (ownerKey: string, notify?: boolean) => void; onClose: () => void }) {
  const [showOptions, setShowOptions] = useState(false)

  if (!showOptions) {
    return (
      <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowOptions(true)}>
        <Ban className="size-3.5" />
        Abandon
      </Button>
    )
  }

  const handleAbandon = (withNotify: boolean) => {
    onClose()
    onMarkAbandoned(ownerKey, withNotify)
  }

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">How do you want to mark this cart?</p>
      <div className="flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="default"
          onClick={() => handleAbandon(true)}
          className="justify-start gap-2"
        >
          <Bell className="size-3.5" />
          Mark abandoned &amp; notify
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleAbandon(false)}
          className="justify-start gap-2"
        >
          <BellOff className="size-3.5" />
          Mark abandoned (no notification)
        </Button>
      </div>
      <Button size="sm" variant="ghost" onClick={() => setShowOptions(false)}>
        Cancel
      </Button>
    </div>
  )
}

function ConvertToUserButton({ ownerKey, onConvert, converting }: { ownerKey: string; onConvert: (ownerKey: string, userId: number) => void; converting: boolean }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserType[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch users from API when search query changes
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const result = await adminGetUsers({ search: searchQuery, per_page: 10 })
        setSearchResults(result.data)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery])

  if (!open) {
    return (
      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setOpen(true)} disabled={converting}>
        <UserPlus className="size-3.5" />
        {converting ? "Converting..." : "Convert to user"}
      </Button>
    )
  }

  return (
    <div className="col-span-full space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">Search for a user to assign this cart to:</p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Type name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
          autoFocus
        />
      </div>

      {searching && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!searching && searchResults.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {searchResults.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                selectedUser?.id === u.id
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-muted"
              }`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {u.first_name[0]}{u.last_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.full_name ?? `${u.first_name} ${u.last_name}`}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              {selectedUser?.id === u.id && <Check className="size-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">No users found</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1"
          disabled={!selectedUser || converting}
          onClick={() => {
            if (selectedUser) {
              onConvert(ownerKey, selectedUser.id)
            }
          }}
        >
          {converting ? "Converting..." : `Assign to ${selectedUser?.full_name?.split(" ")[0] ?? "user"}`}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
