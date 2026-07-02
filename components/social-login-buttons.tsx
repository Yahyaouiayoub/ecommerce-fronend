"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api/client"
import { toast } from "sonner"

interface SocialProvider {
  name: string
  label: string
}

const PROVIDER_ICONS: Record<string, string> = {
  google: "G",
  facebook: "f",
  twitter: "𝕏",
  github: "gh",
}

const PROVIDER_COLORS: Record<string, string> = {
  google: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
  facebook: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
  twitter: "hover:bg-neutral-50 dark:hover:bg-neutral-950/20",
  github: "hover:bg-neutral-50 dark:hover:bg-neutral-950/20",
}

export function SocialLoginButtons() {
  const [providers, setProviders] = useState<SocialProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState<string | null>(null)

  useEffect(() => {
    api.get("/auth/providers")
      .then((res) => setProviders(res.data.providers))
      .catch(() => { /* ignore - social auth not configured */ })
      .finally(() => setLoading(false))
  }, [])

  async function handleSocialLogin(provider: string) {
    setSigningIn(provider)
    try {
      const { data } = await api.get<{ redirect_url: string }>(`/auth/${provider}/redirect`)

      // Open a popup window for OAuth
      const width = 600
      const height = 700
      const left = window.screenX + (window.innerWidth - width) / 2
      const top = window.screenY + (window.innerHeight - height) / 2

      const popup = window.open(
        data.redirect_url,
        `oauth-${provider}`,
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      )

      if (!popup) {
        toast.error("Popup was blocked. Please allow popups for this site.")
        setSigningIn(null)
        return
      }

      // Listen for the callback message from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        const message = event.data
        if (message?.type === "social-auth-callback") {
          window.removeEventListener("message", handleMessage)

          if (message.success) {
            // Store the token and reload to let useAuth pick it up
            localStorage.setItem("auth_token", message.token)
            document.cookie = `auth_token=${message.token}; path=/; max-age=86400; SameSite=Lax`
            window.location.href = message.user?.role === "admin" ? "/dashboard" : "/"
          } else {
            toast.error(message.error || "Social login failed")
          }
          setSigningIn(null)
        }
      }

      window.addEventListener("message", handleMessage)

      // Poll the popup for completion (fallback if message event doesn't fire)
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer)
          window.removeEventListener("message", handleMessage)
          setSigningIn(null)
        }
      }, 500)
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message || "Failed to initiate social login"
        : "Failed to initiate social login"
      toast.error(msg)
      setSigningIn(null)
    }
  }

  if (loading || providers.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="relative">
        <Separator className="my-4" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or continue with
        </span>
      </div>

      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <Button
            key={provider.name}
            type="button"
            variant="outline"
            size="lg"
            disabled={signingIn === provider.name}
            onClick={() => handleSocialLogin(provider.name)}
            className={`gap-3 font-normal ${PROVIDER_COLORS[provider.name] ?? ""}`}
          >
            {signingIn === provider.name ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <span className="flex size-5 items-center justify-center text-xs font-bold">
                {PROVIDER_ICONS[provider.name] ?? provider.label[0]}
              </span>
            )}
            Continue with {provider.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
