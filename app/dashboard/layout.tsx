"use client"

import type { ReactNode } from "react"
import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { AdminSidebar } from "@/components/admin-sidebar"

function DashboardContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          collapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
