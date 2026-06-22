"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Package,
  Layers,
  Tag,
  ShoppingCart,
  ClipboardList,
  Banknote,
  Users,
  LayoutDashboard,
  Settings2,
  Store,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  PanelLeft,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"
import { useTheme } from "next-themes"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories", icon: Layers },
  { href: "/dashboard/brands", label: "Brands", icon: Tag },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/carts", label: "Carts", icon: ClipboardList },
  { href: "/dashboard/expenses", label: "Expenses", icon: Banknote },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
  { href: "/dashboard/users", label: "Users", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 flex size-9 items-center justify-center rounded-lg border border-border bg-background shadow-sm md:hidden"
        aria-label="Open sidebar"
      >
        <PanelLeft className="size-4" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 font-semibold tracking-tight text-sidebar-foreground",
              collapsed && "justify-center w-full",
            )}
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-bold shrink-0">
              L
            </div>
            {!collapsed && <span className="text-sm truncate">Lumen Admin</span>}
          </Link>
          <button
            onClick={toggle}
            className={cn(
              "ml-auto hidden size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors shrink-0 md:flex",
              collapsed && "ml-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn("size-4.5 shrink-0", isActive ? "text-accent" : "")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border px-2 py-3 space-y-0.5 shrink-0">
          {/* View Store */}
          <Link
            href="/"
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center" : "",
              "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
            title={collapsed ? "View Store" : undefined}
          >
            <Store className="size-4.5 shrink-0" />
            {!collapsed && <span>View Store</span>}
          </Link>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "",
                "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
              title={collapsed ? "Toggle theme" : undefined}
            >
              {theme === "dark" ? (
                <Sun className="size-4.5 shrink-0" />
              ) : (
                <Moon className="size-4.5 shrink-0" />
              )}
              {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
