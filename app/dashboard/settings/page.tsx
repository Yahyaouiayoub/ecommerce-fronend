"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Settings2, Truck, Receipt, FileText, Save, Plus, Trash2, GripVertical } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { useApi } from "@/lib/hooks/use-api"
import { adminGetSettings, adminUpdateSettings, adminGetShippingMethods, adminCreateShippingMethod, adminUpdateShippingMethod, adminDeleteShippingMethod } from "@/lib/api/services"
import { getApiErrorMessage } from "@/lib/api/client"
import type { AdminSettingsResponse, ShippingSettings, TaxSettings, ShippingMethod, InvoiceSettings } from "@/lib/types"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const { data, loading, error, reload } = useApi<AdminSettingsResponse>(
    () => adminGetSettings(),
    [],
  )

  // Shipping methods state
  const { data: methods, loading: methodsLoading, reload: reloadMethods } = useApi<ShippingMethod[]>(
    () => adminGetShippingMethods(),
    [],
  )
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
  const [methodForm, setMethodForm] = useState({
    name: "",
    description: "",
    cost: "",
    estimated_days: "",
  })
  const [savingMethod, setSavingMethod] = useState(false)

  const [saving, setSaving] = useState(false)
  const [shipping, setShipping] = useState<ShippingSettings>({
    enabled: true,
    free_shipping: true,
    free_shipping_min: 75,
    standard_cost: 8,
    message: "Free shipping on orders over $75",
  })
  const [tax, setTax] = useState<TaxSettings>({
    enabled: true,
    rate: 8,
    type: "percentage",
    label: "Estimated tax",
  })
  const [invoice, setInvoice] = useState<InvoiceSettings>({
    auto_generate: true,
    prefix: "INV-",
    number_format: "YEAR_MONTH_SEQ",
    company_name: "Lumen Store",
    company_address: "123 Commerce Street",
    company_city: "Casablanca",
    company_country: "Morocco",
    company_phone: "+212 5XX-XXXXXX",
    company_email: "contact@lumenstore.com",
    payment_terms: 30,
    footer_notes: "Thank you for your business!",
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (data) {
      setShipping(data.shipping)
      setTax(data.tax)
      if (data.invoice) setInvoice(data.invoice)
    }
  }, [data])

  function resetMethodForm() {
    setMethodForm({ name: "", description: "", cost: "", estimated_days: "" })
    setEditingMethod(null)
    setShowMethodForm(false)
  }

  function openEditMethod(method: ShippingMethod) {
    setEditingMethod(method)
    setMethodForm({
      name: method.name,
      description: method.description ?? "",
      cost: String(method.cost),
      estimated_days: method.estimated_days ? String(method.estimated_days) : "",
    })
    setShowMethodForm(true)
  }

  async function handleSaveMethod(e: React.FormEvent) {
    e.preventDefault()
    setSavingMethod(true)
    try {
      const payload = {
        name: methodForm.name,
        description: methodForm.description || undefined,
        cost: parseFloat(methodForm.cost) || 0,
        estimated_days: methodForm.estimated_days ? parseInt(methodForm.estimated_days) : undefined,
      }
      if (editingMethod) {
        await adminUpdateShippingMethod(editingMethod.id, payload)
        toast.success("Shipping method updated")
      } else {
        await adminCreateShippingMethod(payload)
        toast.success("Shipping method created")
      }
      resetMethodForm()
      reloadMethods()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save shipping method"))
    } finally {
      setSavingMethod(false)
    }
  }

  async function handleDeleteMethod(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await adminDeleteShippingMethod(id)
      toast.success("Shipping method deleted")
      reloadMethods()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete shipping method"))
    }
  }

  function validateSettings(): string | null {
    if (shipping.enabled) {
      if (shipping.free_shipping_min < 0) {
        return "Free shipping minimum amount cannot be negative."
      }
      if (shipping.standard_cost < 0) {
        return "Standard shipping cost cannot be negative."
      }
    }
    if (tax.enabled) {
      if (tax.rate < 0) {
        return `${tax.type === "percentage" ? "Tax rate" : "Tax amount"} cannot be negative.`
      }
      if (tax.type === "percentage" && tax.rate > 100) {
        return "Tax rate cannot exceed 100%."
      }
    }
    return null
  }

  async function handleSave() {
    const validationError = validateSettings()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const settings: Record<string, string> = {
        shipping_enabled: shipping.enabled ? "1" : "0",
        free_shipping_enabled: shipping.free_shipping ? "1" : "0",
        free_shipping_min_amount: String(shipping.free_shipping_min),
        standard_shipping_cost: String(shipping.standard_cost),
        shipping_message: shipping.message,
        tax_enabled: tax.enabled ? "1" : "0",
        tax_rate: String(tax.rate),
        tax_type: tax.type,
        tax_label: tax.label,
        // Invoice settings
        invoice_auto_generate: invoice.auto_generate ? "1" : "0",
        invoice_prefix: invoice.prefix,
        invoice_number_format: invoice.number_format,
        company_name: invoice.company_name,
        company_address: invoice.company_address,
        company_city: invoice.company_city,
        company_country: invoice.company_country,
        company_phone: invoice.company_phone,
        company_email: invoice.company_email,
        invoice_payment_terms_days: String(invoice.payment_terms),
        invoice_footer_notes: invoice.footer_notes,
      }
      await adminUpdateSettings(settings)
      toast.success("Settings saved")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return null

  const isDirty = data && (
    data.shipping.enabled !== shipping.enabled ||
    data.shipping.free_shipping !== shipping.free_shipping ||
    data.shipping.free_shipping_min !== shipping.free_shipping_min ||
    data.shipping.standard_cost !== shipping.standard_cost ||
    data.shipping.message !== shipping.message ||
    data.tax.enabled !== tax.enabled ||
    data.tax.rate !== tax.rate ||
    data.tax.type !== tax.type ||
    data.tax.label !== tax.label ||
    (data.invoice && (
      data.invoice.auto_generate !== invoice.auto_generate ||
      data.invoice.prefix !== invoice.prefix ||
      data.invoice.number_format !== invoice.number_format ||
      data.invoice.company_name !== invoice.company_name ||
      data.invoice.company_address !== invoice.company_address ||
      data.invoice.company_city !== invoice.company_city ||
      data.invoice.company_country !== invoice.company_country ||
      data.invoice.company_phone !== invoice.company_phone ||
      data.invoice.company_email !== invoice.company_email ||
      data.invoice.payment_terms !== invoice.payment_terms ||
      data.invoice.footer_notes !== invoice.footer_notes
    ))
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage shipping and tax configuration
          </p>
        </div>
        {isDirty && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error ? (
        <StateMessage
          icon={<Settings2 className="size-6" />}
          title="Couldn't load settings"
          action={<Button onClick={reload} variant="outline">Try again</Button>}
        />
      ) : (
        <div className="mt-8 space-y-8">
          {/* Shipping Settings */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Truck className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Shipping Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure shipping methods, costs, and free shipping thresholds.
                </p>
              </div>
            </div>
            <Separator className="my-5" />
            <div className="space-y-6">
              {/* Enable/disable shipping */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enable shipping</p>
                  <p className="text-xs text-muted-foreground">Charge shipping costs on orders</p>
                </div>
                <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={shipping.enabled}
                    onChange={(e) => setShipping({ ...shipping, enabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {shipping.enabled && (
                <>
                  {/* Free shipping toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Enable free shipping</p>
                      <p className="text-xs text-muted-foreground">Offer free shipping on orders above a minimum amount</p>
                    </div>
                    <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={shipping.free_shipping}
                        onChange={(e) => setShipping({ ...shipping, free_shipping: e.target.checked })}
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                      <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>

                  {shipping.free_shipping && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="free_min">Free shipping minimum amount ($)</Label>
                        <Input
                          id="free_min"
                          type="number"
                          min="0"
                          value={shipping.free_shipping_min}
                          onChange={(e) => setShipping({ ...shipping, free_shipping_min: Number(e.target.value) })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Standard shipping cost */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="shipping_cost">Standard shipping cost ($)</Label>
                      <Input
                        id="shipping_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={shipping.standard_cost}
                        onChange={(e) => setShipping({ ...shipping, standard_cost: Number(e.target.value) })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Shipping message */}
                  <div>
                    <Label htmlFor="shipping_msg">Shipping message (shown on homepage, cart, and checkout)</Label>
                    <Input
                      id="shipping_msg"
                      value={shipping.message}
                      onChange={(e) => setShipping({ ...shipping, message: e.target.value })}
                      className="mt-1.5"
                      placeholder="Free shipping on orders over $75"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      This message appears on the homepage perks section, cart, and checkout pages.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Shipping Methods Management */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Truck className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Shipping Methods</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage available shipping options with rates and delivery estimates.
                  </p>
                </div>
              </div>
              {!showMethodForm && (
                <Button size="sm" onClick={() => { resetMethodForm(); setShowMethodForm(true) }}>
                  <Plus className="size-4" />
                  Add method
                </Button>
              )}
            </div>
            <Separator className="my-5" />

            {/* Method form */}
            {showMethodForm && (
              <form onSubmit={handleSaveMethod} className="mb-6 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {editingMethod ? "Edit method" : "New shipping method"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="method_name">Name *</Label>
                    <Input id="method_name" value={methodForm.name} onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="method_cost">Cost ($) *</Label>
                    <Input id="method_cost" type="number" min="0" step="0.01" value={methodForm.cost} onChange={(e) => setMethodForm({ ...methodForm, cost: e.target.value })} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="method_days">Estimated delivery (days)</Label>
                    <Input id="method_days" type="number" min="1" value={methodForm.estimated_days} onChange={(e) => setMethodForm({ ...methodForm, estimated_days: e.target.value })} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="method_desc">Description</Label>
                    <Input id="method_desc" value={methodForm.description} onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })} className="mt-1" placeholder="Estimated delivery time, details..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={savingMethod}>
                    {savingMethod ? "Saving..." : editingMethod ? "Update method" : "Create method"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetMethodForm}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Methods list */}
            {methodsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !methods || methods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipping methods configured yet.</p>
            ) : (
              <div className="space-y-2">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.name}</p>
                          {!method.is_active && (
                            <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {method.description && <span>{method.description} · </span>}
                          {formatPrice(method.cost)}
                          {method.estimated_days && ` · ${method.estimated_days} days`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button variant="ghost" size="xs" onClick={() => openEditMethod(method)}>Edit</Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMethod(method.id, method.name)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Invoice Settings */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <FileText className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Invoice Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure invoice numbering, company info, and PDF generation.
                </p>
              </div>
            </div>
            <Separator className="my-5" />
            <div className="space-y-6">
              {/* Auto-generate toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto-generate invoices</p>
                  <p className="text-xs text-muted-foreground">Automatically create invoices when orders are placed</p>
                </div>
                <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={invoice.auto_generate}
                    onChange={(e) => setInvoice({ ...invoice, auto_generate: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {/* Invoice Prefix & Number Format */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="inv_prefix">Invoice Prefix</Label>
                  <Input
                    id="inv_prefix"
                    value={invoice.prefix}
                    onChange={(e) => setInvoice({ ...invoice, prefix: e.target.value })}
                    className="mt-1.5"
                    placeholder="INV-"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">E.g. INV-202606-0001</p>
                </div>
                <div>
                  <Label htmlFor="inv_format">Number Format</Label>
                  <select
                    id="inv_format"
                    value={invoice.number_format}
                    onChange={(e) => setInvoice({ ...invoice, number_format: e.target.value })}
                    className="mt-1.5 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="YEAR_MONTH_SEQ">INV-202606-0001</option>
                    <option value="YEAR_SEQ">INV-2026-0001</option>
                    <option value="MONTH_SEQ">INV-06-0001</option>
                    <option value="SEQ">INV-0001</option>
                  </select>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="inv_terms">Payment Terms (days)</Label>
                  <Input
                    id="inv_terms"
                    type="number"
                    min="0"
                    value={invoice.payment_terms}
                    onChange={(e) => setInvoice({ ...invoice, payment_terms: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Days until payment is due</p>
                </div>
              </div>

              <Separator />
              <h3 className="text-sm font-semibold text-muted-foreground">Company Information (for PDF invoices)</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="co_name">Company Name</Label>
                  <Input id="co_name" value={invoice.company_name} onChange={(e) => setInvoice({ ...invoice, company_name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="co_email">Company Email</Label>
                  <Input id="co_email" type="email" value={invoice.company_email} onChange={(e) => setInvoice({ ...invoice, company_email: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="co_phone">Company Phone</Label>
                  <Input id="co_phone" value={invoice.company_phone} onChange={(e) => setInvoice({ ...invoice, company_phone: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="co_address">Company Address</Label>
                  <Input id="co_address" value={invoice.company_address} onChange={(e) => setInvoice({ ...invoice, company_address: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="co_city">City</Label>
                  <Input id="co_city" value={invoice.company_city} onChange={(e) => setInvoice({ ...invoice, company_city: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="co_country">Country</Label>
                  <Input id="co_country" value={invoice.company_country} onChange={(e) => setInvoice({ ...invoice, company_country: e.target.value })} className="mt-1.5" />
                </div>
              </div>

              {/* Footer Notes */}
              <div>
                <Label htmlFor="inv_footer">Footer Notes</Label>
                <Input
                  id="inv_footer"
                  value={invoice.footer_notes}
                  onChange={(e) => setInvoice({ ...invoice, footer_notes: e.target.value })}
                  className="mt-1.5"
                  placeholder="Thank you for your business!"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown at the bottom of PDF invoices.
                </p>
              </div>
            </div>
          </section>

          {/* Tax Settings */}
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Receipt className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tax Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure tax rates and calculation methods.
                </p>
              </div>
            </div>
            <Separator className="my-5" />
            <div className="space-y-6">
              {/* Enable/disable tax */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enable tax</p>
                  <p className="text-xs text-muted-foreground">Apply tax to orders during checkout</p>
                </div>
                <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={tax.enabled}
                    onChange={(e) => setTax({ ...tax, enabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {tax.enabled && (
                <>
                  {/* Tax type */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="tax_type">Tax type</Label>
                      <select
                        id="tax_type"
                        value={tax.type}
                        onChange={(e) => setTax({ ...tax, type: e.target.value as "percentage" | "fixed" })}
                        className="mt-1.5 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tax_rate">
                        {tax.type === "percentage" ? "Tax rate (%)" : "Tax amount ($)"}
                      </Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={tax.rate}
                        onChange={(e) => setTax({ ...tax, rate: Number(e.target.value) })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Tax label */}
                  <div>
                    <Label htmlFor="tax_label">Tax label (displayed on order summary)</Label>
                    <Input
                      id="tax_label"
                      value={tax.label}
                      onChange={(e) => setTax({ ...tax, label: e.target.value })}
                      className="mt-1.5"
                      placeholder="Estimated tax"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Bottom save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save all changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
