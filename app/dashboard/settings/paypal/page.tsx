"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Settings2, Save, RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { api, getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PayPalSettings {
  enabled: boolean
  mode: string
  client_id: string
  client_secret: string
  webhook_id: string
}

export default function PayPalSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [settings, setSettings] = useState<PayPalSettings>({
    enabled: false,
    mode: "sandbox",
    client_id: "",
    client_secret: "",
    webhook_id: "",
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    api.get("/admin/paypal/settings")
      .then((res) => {
        const data = res.data
        setSettings({
          enabled: data.enabled ?? false,
          mode: data.mode ?? "sandbox",
          client_id: data.client_id ?? "",
          client_secret: data.client_secret ?? "",
          webhook_id: data.webhook_id ?? "",
        })
      })
      .catch(() => {
        toast.error("Failed to load PayPal settings")
      })
      .finally(() => setLoading(false))
  }, [authLoading])

  async function handleSave() {
    setSaving(true)
    setTestResult(null)
    try {
      await api.post("/admin/paypal/settings", {
        enabled: settings.enabled,
        mode: settings.mode,
        client_id: settings.client_id,
        client_secret: settings.client_secret,
        webhook_id: settings.webhook_id || undefined,
      })
      toast.success("PayPal settings saved")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await api.post("/admin/paypal/test")
      setTestResult(data)
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Connection test failed")
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  if (authLoading) return null

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PayPal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure PayPal payment gateway settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={testing || !settings.client_id || !settings.client_secret}
            onClick={handleTestConnection}
          >
            <RefreshCw className={`size-3.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="size-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* PayPal Settings Form */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent text-lg font-bold">
              P
            </div>
            <div>
              <h2 className="text-lg font-semibold">PayPal Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Enter your PayPal REST API credentials. Get them from the{" "}
                <a
                  href="https://developer.paypal.com/dashboard/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-1"
                >
                  PayPal Developer Dashboard
                  <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </div>
          <Separator className="my-5" />

          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable PayPal</p>
                <p className="text-xs text-muted-foreground">
                  Show PayPal as a payment method during checkout
                </p>
              </div>
              <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Mode */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="paypal_mode">Mode</Label>
                <Select
                  id="paypal_mode"
                  value={settings.mode}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                  className="mt-1.5 w-full"
                >
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="live">Live (Production)</option>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use Sandbox for testing, Live for real payments
                </p>
              </div>
            </div>

            {/* Client ID */}
            <div>
              <Label htmlFor="paypal_client_id">Client ID</Label>
              <Input
                id="paypal_client_id"
                value={settings.client_id}
                onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
                className="mt-1.5 font-mono text-sm"
                placeholder="AeK...your-paypal-client-id"
              />
            </div>

            {/* Client Secret */}
            <div>
              <Label htmlFor="paypal_secret">Client Secret</Label>
              <Input
                id="paypal_secret"
                type="password"
                value={settings.client_secret}
                onChange={(e) => setSettings({ ...settings, client_secret: e.target.value })}
                className="mt-1.5 font-mono text-sm"
                placeholder="EL...your-paypal-secret"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Stored securely in the database. Never shared with the frontend.
              </p>
            </div>

            {/* Webhook ID */}
            <div>
              <Label htmlFor="paypal_webhook">Webhook ID (optional)</Label>
              <Input
                id="paypal_webhook"
                value={settings.webhook_id}
                onChange={(e) => setSettings({ ...settings, webhook_id: e.target.value })}
                className="mt-1.5 font-mono text-sm"
                placeholder="Optional — for webhook verification"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used to verify incoming PayPal webhook notifications
              </p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                "mt-6 rounded-lg border p-4",
                testResult.success
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
              )}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="size-5 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    testResult.success
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-red-800 dark:text-red-300",
                  )}
                >
                  {testResult.message}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Setup Guide */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">How to get your PayPal API credentials</h2>
          <Separator className="my-4" />
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">1</span>
              <span>Go to the{" "}
                <a
                  href="https://developer.paypal.com/dashboard/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  PayPal Developer Dashboard
                </a>
                {" "}and log in with your PayPal account.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">2</span>
              <span>Under <strong>REST API apps</strong>, click <strong>Create App</strong> or select an existing app.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">3</span>
              <span>Copy the <strong>Client ID</strong> and <strong>Secret</strong> and paste them above.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">4</span>
              <span>Set the mode to <strong>Sandbox</strong> for testing, then click <strong>Test Connection</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">5</span>
              <span>When ready for production, switch to <strong>Live</strong> and update the credentials.</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  )
}
