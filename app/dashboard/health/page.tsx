"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  HeartPulse,
  Database,
  HardDrive,
  Mail,
  Cog,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Server,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { api, getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"

interface HealthCheck {
  overall: "pass" | "degraded"
  checks: Record<string, {
    status: "pass" | "warn" | "fail"
    message: string
    details: Record<string, unknown>
  }>
  timestamp: string
}

const CHECK_LABELS: Record<string, { label: string; icon: typeof Database }> = {
  database: { label: "Database", icon: Database },
  cache: { label: "Cache", icon: Server },
  storage: { label: "Storage", icon: HardDrive },
  mail: { label: "Mail", icon: Mail },
  config: { label: "Configuration", icon: Cog },
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800" },
  warn: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800" },
  fail: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800" },
} as const

export default function HealthCheckPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<HealthCheck | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test email state
  const [testEmailOpen, setTestEmailOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testEmailDismissing, setTestEmailDismissing] = useState(false)

  // SMTP settings state (for Save & Send flow)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpEncryption, setSmtpEncryption] = useState("")
  const [smtpUsername, setSmtpUsername] = useState("")
  const [smtpPassword, setSmtpPassword] = useState("")
  const [smtpShowPw, setSmtpShowPw] = useState(false)
  const [smtpFromAddress, setSmtpFromAddress] = useState("")
  const [smtpFromName, setSmtpFromName] = useState("")
  const [smtpShowConfig, setSmtpShowConfig] = useState(false)

  // Generic service test state
  const [testingService, setTestingService] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({})
  const [dismissingResults, setDismissingResults] = useState<Record<string, boolean>>({})

  async function handleTestService(service: string) {
    setTestingService(service)
    setTestResults((prev) => ({ ...prev, [service]: null }))
    setDismissingResults((prev) => ({ ...prev, [service]: false }))
    try {
      const { data } = await api.post<{ success: boolean; message: string }>(`/admin/health/test/${service}`)
      setTestResults((prev) => ({ ...prev, [service]: { success: data.success, message: data.message } }))
      setDismissingResults((prev) => ({ ...prev, [service]: false }))
      // Schedule auto-dismiss
      setTimeout(() => {
        setDismissingResults((prev) => ({ ...prev, [service]: true }))
        setTimeout(() => {
          setTestResults((prev) => ({ ...prev, [service]: null }))
          setDismissingResults((prev) => ({ ...prev, [service]: false }))
        }, 500)
      }, 9500)
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, `${service} test failed`)
      setTestResults((prev) => ({ ...prev, [service]: { success: false, message: msg } }))
      toast.error(msg)
      // Schedule auto-dismiss even for errors
      setTimeout(() => {
        setDismissingResults((prev) => ({ ...prev, [service]: true }))
        setTimeout(() => {
          setTestResults((prev) => ({ ...prev, [service]: null }))
          setDismissingResults((prev) => ({ ...prev, [service]: false }))
        }, 500)
      }, 9500)
    } finally {
      setTestingService(null)
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail.trim()) return
    setTestEmailSending(true)
    setTestEmailResult(null)
    setTestEmailDismissing(false)
    try {
      const { data } = await api.post<{ success: boolean; message: string }>("/admin/settings/mail/test", {
        recipient_email: testEmail.trim(),
      })
      setTestEmailResult({ success: data.success, message: data.message })
      toast.success(data.message)
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to send test email")
      setTestEmailResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setTestEmailSending(false)
    }
  }

  async function handleSaveAndTest() {
    if (!testEmail.trim()) return
    setSmtpSaving(true)
    setTestEmailResult(null)
    setTestEmailDismissing(false)
    try {
      // Step 1: Save SMTP settings
      const payload: Record<string, string> = {
        mail_driver: "smtp",
        mail_host: smtpHost,
        mail_port: smtpPort,
        mail_encryption: smtpEncryption,
        mail_username: smtpUsername,
        mail_from_address: smtpFromAddress,
        mail_from_name: smtpFromName,
      }
      if (smtpPassword) {
        payload.mail_password = smtpPassword
      }
      await api.put("/admin/settings/mail", payload)
      setSmtpPassword("")
      setSmtpSaving(false)
      toast.success("Mail settings saved")

      // Step 2: Send test email
      setTestEmailSending(true)
      const { data } = await api.post<{ success: boolean; message: string }>("/admin/settings/mail/test", {
        recipient_email: testEmail.trim(),
      })
      setTestEmailResult({ success: data.success, message: data.message })
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Save and test failed")
      setTestEmailResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setSmtpSaving(false)
      setTestEmailSending(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  // Auto-dismiss test email result after 10 seconds with fade-out
  useEffect(() => {
    if (!testEmailResult) return
    setTestEmailDismissing(false)
    const fadeTimer = setTimeout(() => setTestEmailDismissing(true), 9500)
    const clearTimer = setTimeout(() => {
      setTestEmailResult(null)
      setTestEmailDismissing(false)
    }, 10000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [testEmailResult])

  const fetchHealth = useCallback(async () => {
    try {
      const { data } = await api.get<HealthCheck>("/admin/health")
      setChecks(data)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to run health check"))
      toast.error("Failed to run health check")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    fetchHealth()
  }, [authLoading, fetchHealth])

  function handleRefresh() {
    setRefreshing(true)
    fetchHealth()
  }

  if (authLoading) return null

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-2 h-5 w-72" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <HeartPulse className="size-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Could not run health check</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const overallStatus = checks?.overall === "pass" ? "pass" : "degraded"
  const checkKeys = Object.keys(checks?.checks ?? {})
  const passedCount = Object.values(checks?.checks ?? {}).filter((c) => c.status === "pass").length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              overallStatus === "pass"
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-amber-100 dark:bg-amber-900/30",
            )}>
              <HeartPulse className={cn(
                "size-5",
                overallStatus === "pass"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400",
              )} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {passedCount}/{checkKeys.length} services operational
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm" variant="outline">
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Checking..." : "Refresh"}
        </Button>
      </div>

      {/* Overall Status Banner */}
      <div className={cn(
        "mt-6 rounded-xl border p-4",
        overallStatus === "pass"
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
      )}>
        <div className="flex items-center gap-3">
          {overallStatus === "pass" ? (
            <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <p className={cn(
              "font-semibold",
              overallStatus === "pass"
                ? "text-emerald-800 dark:text-emerald-300"
                : "text-amber-800 dark:text-amber-300",
            )}>
              {overallStatus === "pass" ? "All systems operational" : "Some services need attention"}
            </p>
            <p className="text-sm text-muted-foreground">
              Last checked: {new Date(checks?.timestamp ?? "").toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="mt-8 space-y-4">
        {Object.entries(checks?.checks ?? {}).map(([key, check]) => {
          const meta = CHECK_LABELS[key] ?? { label: key, icon: Activity }
          const statusCfg = STATUS_CONFIG[check.status]
          const StatusIcon = statusCfg.icon
          const Icon = meta.icon

          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border p-5 transition-colors",
                statusCfg.border,
                statusCfg.bg,
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Icon className={cn("size-5 mt-0.5 shrink-0", statusCfg.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{meta.label}</h3>
                      <StatusIcon className={cn("size-4", statusCfg.color)} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{check.message}</p>

                    {/* Details (skip config — it has its own sub-list below) */}
                    {key !== "config" && Object.keys(check.details).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(check.details).map(([detailKey, detailValue]) => (
                          <span
                            key={detailKey}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            <span className="font-medium text-foreground/70">{detailKey}:</span>
                            {String(detailValue)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Test action buttons */}
                    <div className="mt-4 pt-4 border-t border-border">
                      {key === "database" && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingService === "database"}
                            onClick={() => handleTestService("database")}
                          >
                            {testingService === "database" ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Database className="size-3.5" />
                            )}
                            {testingService === "database" ? "Testing..." : "Run Test Query"}
                          </Button>
                          {testResults.database && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs transition-all duration-500",
                                dismissingResults.database ? "opacity-0" : "opacity-100",
                                testResults.database.success
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {testResults.database.success ? (
                                <CheckCircle2 className="size-3.5 shrink-0" />
                              ) : (
                                <XCircle className="size-3.5 shrink-0" />
                              )}
                              {testResults.database.message.length > 80
                                ? testResults.database.message.slice(0, 80) + "…"
                                : testResults.database.message}
                            </span>
                          )}
                        </div>
                      )}

                      {key === "cache" && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingService === "cache"}
                            onClick={() => handleTestService("cache")}
                          >
                            {testingService === "cache" ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Server className="size-3.5" />
                            )}
                            {testingService === "cache" ? "Testing..." : "Test Write/Read"}
                          </Button>
                          {testResults.cache && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs transition-all duration-500",
                                dismissingResults.cache ? "opacity-0" : "opacity-100",
                                testResults.cache.success
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {testResults.cache.success ? (
                                <CheckCircle2 className="size-3.5 shrink-0" />
                              ) : (
                                <XCircle className="size-3.5 shrink-0" />
                              )}
                              {testResults.cache.message.length > 80
                                ? testResults.cache.message.slice(0, 80) + "…"
                                : testResults.cache.message}
                            </span>
                          )}
                        </div>
                      )}

                      {key === "storage" && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingService === "storage"}
                            onClick={() => handleTestService("storage")}
                          >
                            {testingService === "storage" ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <HardDrive className="size-3.5" />
                            )}
                            {testingService === "storage" ? "Testing..." : "Test Write/Read"}
                          </Button>
                          {testResults.storage && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs transition-all duration-500",
                                dismissingResults.storage ? "opacity-0" : "opacity-100",
                                testResults.storage.success
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {testResults.storage.success ? (
                                <CheckCircle2 className="size-3.5 shrink-0" />
                              ) : (
                                <XCircle className="size-3.5 shrink-0" />
                              )}
                              {testResults.storage.message.length > 80
                                ? testResults.storage.message.slice(0, 80) + "…"
                                : testResults.storage.message}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Send Test Email — only on the mail card */}
                      {key === "mail" && (
                        <>
                          {!testEmailOpen ? (
                            <div className="flex items-center gap-3 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTestEmailOpen(true)
                                  setTestEmailResult(null)
                                }}
                              >
                                <Mail className="size-3.5" />
                                Send Test Email
                              </Button>
                              {String(check.details.driver ?? "") && (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-muted-foreground">
                                  <Mail className="size-3" />
                                  Active driver: <span className="font-mono font-medium text-foreground/80">{String(check.details.driver ?? "")}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Active driver badge */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="size-3.5" />
                                Active driver: <span className="font-mono font-medium text-foreground/80">{String(check.details.driver ?? "log")}</span>
                              </div>

                              {/* SMTP Config toggle */}
                              <button
                                type="button"
                                onClick={() => setSmtpShowConfig(!smtpShowConfig)}
                                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                              >
                                <Cog className={cn("size-3 transition-transform", smtpShowConfig && "rotate-90")} />
                                {smtpShowConfig ? "Hide SMTP configuration" : "Save new SMTP settings before testing"}
                              </button>

                              {/* SMTP Configuration fields */}
                              {smtpShowConfig && (
                                <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">SMTP Host</label>
                                      <input
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        placeholder="smtp.gmail.com"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Port</label>
                                      <input
                                        value={smtpPort}
                                        onChange={(e) => setSmtpPort(e.target.value)}
                                        placeholder="587"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Encryption</label>
                                      <select
                                        value={smtpEncryption}
                                        onChange={(e) => setSmtpEncryption(e.target.value)}
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      >
                                        <option value="">None</option>
                                        <option value="tls">TLS</option>
                                        <option value="ssl">SSL</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Username</label>
                                      <input
                                        value={smtpUsername}
                                        onChange={(e) => setSmtpUsername(e.target.value)}
                                        placeholder="user@gmail.com"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Password</label>
                                    <div className="relative">
                                      <input
                                        type={smtpShowPw ? "text" : "password"}
                                        value={smtpPassword}
                                        onChange={(e) => setSmtpPassword(e.target.value)}
                                        placeholder="Enter SMTP password"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 pr-8 text-xs font-mono transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setSmtpShowPw(!smtpShowPw)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                      >
                                        {smtpShowPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">From Email</label>
                                      <input
                                        type="email"
                                        value={smtpFromAddress}
                                        onChange={(e) => setSmtpFromAddress(e.target.value)}
                                        placeholder="noreply@yourstore.com"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">From Name</label>
                                      <input
                                        value={smtpFromName}
                                        onChange={(e) => setSmtpFromName(e.target.value)}
                                        placeholder="Your Store"
                                        className="flex h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Send / Save && Send / Cancel */}
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="email"
                                  value={testEmail}
                                  onChange={(e) => setTestEmail(e.target.value)}
                                  placeholder="recipient@example.com"
                                  required
                                  aria-label="Test email recipient"
                                  className="flex h-9 w-full max-w-xs rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={testEmailSending || !testEmail.trim()}
                                  onClick={handleSendTestEmail}
                                  title="Send using currently saved settings"
                                >
                                  {testEmailSending ? (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  ) : (
                                    <Mail className="size-3.5" />
                                  )}
                                  {testEmailSending ? "Sending..." : "Send Test Email"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  disabled={smtpSaving || testEmailSending || !testEmail.trim()}
                                  onClick={handleSaveAndTest}
                                  className="shrink-0"
                                  title="Save SMTP settings then send test email"
                                >
                                  {smtpSaving || testEmailSending ? (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  ) : (
                                    <Save className="size-3.5" />
                                  )}
                                  {smtpSaving ? "Saving..." : testEmailSending ? "Sending..." : "Save && Send"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTestEmailOpen(false)
                                    setTestEmailResult(null)
                                    setTestEmail("")
                                  }}
                                  disabled={testEmailSending || smtpSaving}
                                >
                                  Cancel
                                </Button>
                              </div>

                              {testEmailResult && (
                                <div
                                  className={cn(
                                    "flex items-center gap-1.5 text-xs transition-all duration-500",
                                    testEmailDismissing ? "opacity-0" : "opacity-100",
                                    testEmailResult.success
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400",
                                  )}
                                >
                                  {testEmailResult.success ? (
                                    <CheckCircle2 className="size-3.5 shrink-0" />
                                  ) : (
                                    <XCircle className="size-3.5 shrink-0" />
                                  )}
                                  {testEmailResult.message}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Config sub-checks */}
                    {key === "config" && check.details && Array.isArray(check.details) && (
                      <div className="mt-3 space-y-1.5">
                        {(check.details as Array<{ key: string; value: string; status: string; note?: string }>).map((cfg) => (
                          <div
                            key={cfg.key}
                            className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {cfg.status === "pass" ? (
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                              )}
                              <code className="text-xs font-medium text-foreground">{cfg.key}</code>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {cfg.value}
                              </span>
                            </div>
                            {cfg.note && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                                {cfg.note}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                  statusCfg.bg,
                  statusCfg.color,
                )}>
                  {check.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
