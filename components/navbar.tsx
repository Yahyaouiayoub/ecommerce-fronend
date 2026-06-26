"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  Moon,
  Sun,
  CreditCard,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAppSelector, selectCartCount } from "@/lib/store"
import { useTheme } from "next-themes"
import { getPublicSettings } from "@/lib/api/services"
import { getImageUrl } from "@/lib/api/client"
import { useSharedData } from "@/lib/hooks/use-api"
import type { PublicSettings } from "@/lib/types"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const NAV_LINKS = [
  { href: "/", labelKey: "home" },
  { href: "/categories", labelKey: "categories" },
  { href: "/products", labelKey: "shop" },
]

export function Navbar() {
  const pathname = usePathname()
  const cartCount = useAppSelector(selectCartCount)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const { data: publicSettings } = useSharedData<PublicSettings>("publicSettings", getPublicSettings)
  const logoUrl = publicSettings?.logo_url
  const t = useTranslations("navbar")

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button 
              className="md:hidden p-2 hover:bg-muted/10 rounded-md transition-colors" 
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left font-mono text-xl tracking-tight">
                {logoUrl ? (
                  <img
                    src={getImageUrl(logoUrl)}
                    alt={t("store_logo")}
                    className="h-7 w-auto max-w-28 object-contain"
                  />
                ) : (
                  "Lumen"
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10",
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-border px-2 pt-4">
              <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account
              </p>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                <UserIcon className="size-4" />
                Profile
              </Link>
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                <Package className="size-4" />
                Orders
              </Link>
              <Link
                href="/payments"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                <CreditCard className="size-4" />
                Payment History
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <img
              src={getImageUrl(logoUrl)}
              alt={t("store_logo")}
              className="h-8 w-auto max-w-32 object-contain"
            />
          ) : (
            <span className="font-mono text-xl font-semibold tracking-tight">
              Lumen
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form
          action="/products"
          className="ml-auto hidden max-w-xs flex-1 items-center lg:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder={t("search")}
              className="pl-9"
              aria-label={t("search")}
            />
          </div>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          {/* Theme Toggle */}
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label={t("toggle_theme")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label={t("account")}>
              <UserIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>
                <Link href="/profile" className="flex items-center gap-2 w-full">
                  <UserIcon className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/orders" className="flex items-center gap-2 w-full">
                  <Package className="size-4" />
                  Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/payments" className="flex items-center gap-2 w-full">
                  <CreditCard className="size-4" />
                  Payment History
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link 
            href="/cart" 
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label={t("cart")}
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}