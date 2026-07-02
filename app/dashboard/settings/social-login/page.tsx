"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Users, Save, Eye, EyeOff, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StateMessage } from "@/components/state-message"
import { useAuth } from "@/lib/hooks/use-auth"
import { api, getApiErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProviderConfig {
  enabled: boolean
  client_id: string
  client_secret: string
  client_has_secret: boolean
  redirect_uri: string
}

interface SocialAuthResponse {
  providers: Record<string, ProviderConfig>
}

const PROVIDER_INFO: Record<string, { label: string; icon: string; docsUrl: string }> = {
  google: {
    label: "Google",
    icon: "G",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
  facebook: {
    label: "Facebook",
    icon: "f",
    docsUrl: "https://developers.facebook.com/apps",
  },
  twitter: {
    label: "X (Twitter)",
    icon: "𝕏",
    docsUrl: "https://developer.x.com/en/apps",
  },
  github: {
    label: "GitHub",
    icon: "gh",
    docsUrl: "https://github.com/settings/developers",
  },
}

export default function SocialLoginSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [secrets, setSecrets] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/profile")
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    api.get<SocialAuthResponse>("/admin/settings/social-auth")
      .then((res) => setProviders(res.data.providers))
      .catch(() => toast.error("Failed to load social auth settings"))
      .finally(() => setLoading(false))
  }, [authLoading])

  async function handleSave(provider: string) {
    setSaving(true)
    try {
      const config = providers[provider]
      const payload: Record<string, unknown> = {
        provider: provider,
        enabled: config.enabled,
      }
      if (config.client_id) payload.client_id = config.client_id
      if (secrets[provider]) payload.client_secret = secrets[provider]
      if (config.redirect_uri) payload.redirect_uri = config.redirect_uri

      await api.put("/admin/settings/social-auth", payload)
      toast.success(`${PROVIDER_INFO[provider].label} settings saved`)
      setSecrets({ ...secrets, [provider]: "" })
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"))
    } finally {
      setSaving(false)
    }
  }

  function toggleShowSecret(provider: string) {
    setShowSecrets({ ...showSecrets, [provider]: !showSecrets[provider] })
  }

  if (authLoading) return null

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-2 h-5 w-64" />
        <div className="mt-8 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Users className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social Authentication</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure OAuth providers for social login. Users can sign in with their existing accounts.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {Object.entries(PROVIDER_INFO).map(([key, info]) => {
          const config = providers[key]
          if (!config) return null

          return (
            <section key={key} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-bold">
                    {info.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{info.label}</h2>
                    <p className="text-sm text-muted-foreground">
                      {config.enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex h-6 w-11 cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        [key]: { ...config, enabled: e.target.checked },
                      })
                    }
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-accent" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              <Separator className="my-5" />

              <div className="space-y-5">
                {/* Client ID */}
                <div>
                  <Label htmlFor={`${key}_client_id`}>Client ID</Label>
                  <Input
                    id={`${key}_client_id`}
                    value={config.client_id}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        [key]: { ...config, client_id: e.target.value },
                      })
                    }
                    className="mt-1.5 font-mono text-sm"
                    placeholder={`${info.label} Client ID`}
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <Label htmlFor={`${key}_client_secret`}>Client Secret</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id={`${key}_client_secret`}
                      type={showSecrets[key] ? "text" : "password"}
                      value={secrets[key] ?? ""}
                      onChange={(e) =>
                        setSecrets({ ...secrets, [key]: e.target.value })
                      }
                      className="font-mono text-sm pr-10"
                      placeholder={
                        config.client_has_secret
                          ? "•••••••• (leave empty to keep current)"
                          : `Enter ${info.label} Client Secret`
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showSecrets[key] ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {config.client_has_secret
                      ? "A secret is already stored. Enter a new one to change it, or leave blank to keep the current."
                      : "Stored securely and never returned to the browser."}
                  </p>
                </div>

                {/* Redirect URI (display only) */}
                <div>
                  <Label htmlFor={`${key}_redirect_uri`}>Redirect URI</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id={`${key}_redirect_uri`}
                      value={config.redirect_uri}
                      onChange={(e) =>
                        setProviders({
                          ...providers,
                          [key]: { ...config, redirect_uri: e.target.value },
                        })
                      }
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(config.redirect_uri)
                        toast.success("Redirect URI copied")
                      }}
                      title="Copy redirect URI"
                    >
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add this URL to your {info.label} OAuth app settings.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <a
                  href={info.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  <ExternalLink className="size-3" />
                  {info.label} Developer Console
                </a>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="size-3.5" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
