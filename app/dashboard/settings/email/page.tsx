"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Mail, Save, RefreshCw, CheckCircle, XCircle, Send, Eye, EyeOff, ExternalLink } from "lucide-react"
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

interface MailSettings {
  mail_driver: string
  active_driver: string
  mail_host: string
  mail_port: string
  mail_encryption: string
  mail_username: string
  mail_has_password: boolean
  mail_from_address: string
  mail_from_name: string
}

const DRIVER_OPTIONS = [
  { value: "smtp", label: "SMTP" },
  { value: "sendmail", label: "Sendmail" },
  { value: "log", label: "Log (for development)" },
  { value: "mailgun", label: "Mailgun" },
  { value: "ses", label: "Amazon SES" },
  { value: "postmark", label: "Postmark" },
  { value: "array", label: "Array (for testing)" },
]

const ENCRYPTION_OPTIONS = [
  { value: "", label: "None" },
  { value: "tls", label: "TLS" },
  { value: "ssl", label: "SSL" },
]

export default function MailSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testResultDismissing, setTestResultDismissing] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [settings, setSettings] = useState<MailSettings>({
    mail_driver: "log",
    active_driver: "log",
    mail_host: "",
    mail_port: "587",
    mail_encryption: "",
    mail_username: "",
    mail_has_password: false,
    mail_from_address: "",
    mail_from_name: "",
  })

  const [testEmail, setTestEmail] = useState("")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    api.get("/admin/settings/mail")
      .then((res) => {
        const data = res.data
        setSettings({
          mail_driver: data.mail_driver ?? "log",
          active_driver: data.active_driver ?? "log",
          mail_host: data.mail_host ?? "",
          mail_port: data.mail_port ?? "587",
          mail_encryption: data.mail_encryption ?? "",
          mail_username: data.mail_username ?? "",
          mail_has_password: data.mail_has_password ?? false,
          mail_from_address: data.mail_from_address ?? "",
          mail_from_name: data.mail_from_name ?? "",
        })
        setTestEmail(data.mail_from_address ?? "")
      })
      .catch(() => {
        toast.error("Failed to load mail settings")
      })
      .finally(() => setLoading(false))
  }, [authLoading])

  // Auto-dismiss test result after 10 seconds with fade-out
  useEffect(() => {
    if (!testResult) return
    const fadeTimer = setTimeout(() => setTestResultDismissing(true), 9500)
    const clearTimer = setTimeout(() => {
      setTestResult(null)
      setTestResultDismissing(false)
    }, 10000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [testResult])

  function buildPayload() {
    const payload: Record<string, string> = {
      mail_driver: settings.mail_driver,
      mail_host: settings.mail_host,
      mail_port: settings.mail_port,
      mail_encryption: settings.mail_encryption,
      mail_username: settings.mail_username,
      mail_from_address: settings.mail_from_address,
      mail_from_name: settings.mail_from_name,
    }
    if (password) {
      payload.mail_password = password
    }
    return payload
  }

  async function handleSave() {
    setSaving(true)
    setTestResult(null)
    try {
      const payload = buildPayload()
      const { data } = await api.put("/admin/settings/mail", payload)
      setSettings({
        mail_driver: data.mail_driver ?? settings.mail_driver,
        active_driver: data.active_driver ?? settings.active_driver,
        mail_host: data.mail_host ?? settings.mail_host,
        mail_port: data.mail_port ?? settings.mail_port,
        mail_encryption: data.mail_encryption ?? settings.mail_encryption,
        mail_username: data.mail_username ?? settings.mail_username,
        mail_has_password: data.mail_has_password ?? false,
        mail_from_address: data.mail_from_address ?? settings.mail_from_address,
        mail_from_name: data.mail_from_name ?? settings.mail_from_name,
      })
      setPassword("")
      toast.success("Mail settings saved")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save mail settings"))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    if (!testEmail) {
      toast.error("Please enter a recipient email address")
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await api.post("/admin/settings/mail/test", {
        recipient_email: testEmail,
      })
      setTestResult(data)
      setTestResultDismissing(false)
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Connection test failed")
      setTestResult({ success: false, message: msg })
      setTestResultDismissing(false)
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  async function handleSaveAndTest() {
    if (!testEmail) {
      toast.error("Please enter a recipient email address")
      return
    }      setSaving(true)
    setTestResult(null)
    try {
      // Step 1: Save settings to DB so MailConfigServiceProvider picks them up
      const payload = buildPayload()
      const saveRes = await api.put("/admin/settings/mail", payload)
      setSettings({
        mail_driver: saveRes.data.mail_driver ?? settings.mail_driver,
        active_driver: saveRes.data.active_driver ?? settings.active_driver,
        mail_host: saveRes.data.mail_host ?? settings.mail_host,
        mail_port: saveRes.data.mail_port ?? settings.mail_port,
        mail_encryption: saveRes.data.mail_encryption ?? settings.mail_encryption,
        mail_username: saveRes.data.mail_username ?? settings.mail_username,
        mail_has_password: saveRes.data.mail_has_password ?? false,
        mail_from_address: saveRes.data.mail_from_address ?? settings.mail_from_address,
        mail_from_name: saveRes.data.mail_from_name ?? settings.mail_from_name,
      })
      setPassword("")
      setSaving(false)
      toast.success("Mail settings saved")

      // Step 2: Send test email using the freshly saved settings
      setTesting(true)
      const testRes = await api.post("/admin/settings/mail/test", {
        recipient_email: testEmail,
      })
      setTestResult(testRes.data)
      setTestResultDismissing(false)
      if (testRes.data.success) {
        toast.success(testRes.data.message)
      } else {
        toast.error(testRes.data.message)
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Save and test failed")
      setTestResult({ success: false, message: msg })
      setTestResultDismissing(false)
      toast.error(msg)
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-semibold tracking-tight">Email (SMTP)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure email sending for order confirmations, invoices, password resets,
            and all other system emails.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="size-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="mt-8 space-y-8">
        {/* Mail Driver & SMTP Settings */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Mail className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SMTP Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Configure the email driver and SMTP server settings.
              </p>
            </div>
          </div>
          <Separator className="my-5" />

          <div className="space-y-6">
            {/* Mail Driver */}
            <div>
              <Label htmlFor="mail_driver">Mail Driver</Label>
              <Select
                id="mail_driver"
                value={settings.mail_driver}
                onChange={(e) => setSettings({ ...settings, mail_driver: e.target.value })}
                className="mt-1.5 w-full"
              >
                {DRIVER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {settings.mail_driver === "smtp" && (
              <>
                {/* SMTP Host & Port */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="mail_host">SMTP Host</Label>
                    <Input
                      id="mail_host"
                      value={settings.mail_host}
                      onChange={(e) => setSettings({ ...settings, mail_host: e.target.value })}
                      className="mt-1.5 font-mono text-sm"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mail_port">SMTP Port</Label>
                    <Input
                      id="mail_port"
                      value={settings.mail_port}
                      onChange={(e) => setSettings({ ...settings, mail_port: e.target.value })}
                      className="mt-1.5 font-mono text-sm"
                      placeholder="587"
                    />
                  </div>
                </div>

                {/* Encryption */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="mail_encryption">Encryption</Label>
                    <Select
                      id="mail_encryption"
                      value={settings.mail_encryption}
                      onChange={(e) => setSettings({ ...settings, mail_encryption: e.target.value })}
                      className="mt-1.5 w-full"
                    >
                      {ENCRYPTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* SMTP Username */}
                <div>
                  <Label htmlFor="mail_username">SMTP Username</Label>
                  <Input
                    id="mail_username"
                    value={settings.mail_username}
                    onChange={(e) => setSettings({ ...settings, mail_username: e.target.value })}
                    className="mt-1.5 font-mono text-sm"
                    placeholder="user@gmail.com"
                  />
                </div>

                {/* SMTP Password */}
                <div>
                  <Label htmlFor="mail_password">SMTP Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="mail_password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 font-mono text-sm pr-10"
                      placeholder={
                        settings.mail_has_password
                          ? "•••••••• (leave empty to keep current)"
                          : "Enter SMTP password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {settings.mail_has_password
                      ? "A password is already stored. Enter a new one to change it, or leave blank to keep the current password."
                      : "The password is encrypted before storing and never returned to the browser."}
                  </p>
                </div>
              </>
            )}

            {settings.mail_driver !== "smtp" && settings.mail_driver !== "log" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{DRIVER_OPTIONS.find((o) => o.value === settings.mail_driver)?.label}</strong>{" "}
                  requires additional configuration via your{" "}
                  <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env</code> file.
                  Switch to <strong>SMTP</strong> to configure credentials from the dashboard.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Sender Information */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Send className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sender Information</h2>
              <p className="text-sm text-muted-foreground">
                The name and email address that appear in the "From" field of all outgoing emails.
              </p>
            </div>
          </div>
          <Separator className="my-5" />

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mail_from_address">From Email Address</Label>
                <Input
                  id="mail_from_address"
                  type="email"
                  value={settings.mail_from_address}
                  onChange={(e) => setSettings({ ...settings, mail_from_address: e.target.value })}
                  className="mt-1.5"
                  placeholder="noreply@yourstore.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Used for all outgoing emails (order confirmations, invoices, password resets, etc.)
                </p>
              </div>
              <div>
                <Label htmlFor="mail_from_name">From Name</Label>
                <Input
                  id="mail_from_name"
                  value={settings.mail_from_name}
                  onChange={(e) => setSettings({ ...settings, mail_from_name: e.target.value })}
                  className="mt-1.5"
                  placeholder="Your Store Name"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Test Connection */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <RefreshCw className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Test Connection</h2>
              <p className="text-sm text-muted-foreground">
                Send a test email to verify that your SMTP configuration is working.
                Unsaved changes must be saved first before they are used by the test.
              </p>
            </div>
          </div>
          <Separator className="my-5" />

          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="test_email">Recipient Email Address</Label>
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="mt-1.5"
                  placeholder="you@example.com"
                />
              </div>
              <Button
                variant="outline"
                disabled={testing || !testEmail}
                onClick={handleTestConnection}
                className="shrink-0"
                title="Send using currently saved settings"
              >
                <RefreshCw className={`size-3.5 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Sending..." : "Send Test Email"}
              </Button>
              <Button
                variant="default"
                disabled={testing || saving || !testEmail}
                onClick={handleSaveAndTest}
                className="shrink-0"
                title="Save settings then send test email"
              >
                {saving || testing ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {saving ? "Saving..." : testing ? "Testing..." : "Save && Send"}
              </Button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3" />
              Active driver:{" "}
              <span className="font-mono font-medium text-foreground/80">
                {settings.active_driver ?? settings.mail_driver ?? "log"}
              </span>
              {settings.active_driver !== settings.mail_driver && (
                <span className="rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                  DB value differs
                </span>
              )}
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={cn(
                  "rounded-lg border p-4 transition-all duration-500",
                  testResultDismissing ? "opacity-0 scale-95" : "opacity-100 scale-100",
                  testResult.success
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
                )}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
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
          </div>
        </section>

        {/* How to get SMTP credentials */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">SMTP Provider Guides</h2>
          <Separator className="my-4" />
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Most email providers offer free SMTP access. Here are a few popular options:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="https://support.google.com/mail/answer/7126229"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 hover:border-accent transition-colors"
              >
                <span className="font-medium text-foreground">Gmail</span>
                <span className="flex-1 text-xs">smtp.gmail.com · Port 587 · TLS</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
              <a
                href="https://sendgrid.com/docs/for-developers/sending-email/integrating-with-the-smtp-api/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 hover:border-accent transition-colors"
              >
                <span className="font-medium text-foreground">SendGrid</span>
                <span className="flex-1 text-xs">smtp.sendgrid.net · Port 587 · TLS</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
              <a
                href="https://www.mailgun.com/docs/sending/smtp/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 hover:border-accent transition-colors"
              >
                <span className="font-medium text-foreground">Mailgun</span>
                <span className="flex-1 text-xs">smtp.mailgun.org · Port 587 · TLS</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
              <a
                href="https://www.mailjet.com/docs/guides/smtp/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 hover:border-accent transition-colors"
              >
                <span className="font-medium text-foreground">Mailjet</span>
                <span className="flex-1 text-xs">in-v3.mailjet.com · Port 587 · TLS</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
            </div>
          </div>
        </section>

        {/* Bottom save */ }
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
