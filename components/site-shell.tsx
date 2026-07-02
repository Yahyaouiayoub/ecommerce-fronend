"use client"

import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnnouncementBar } from "@/components/promotions/AnnouncementBar"
import { useActivePromotions } from "@/lib/hooks/use-promotions"

export function SiteShell({ children }: { children: ReactNode }) {
  const { data: promotions } = useActivePromotions()

  return (
    <div className="flex min-h-dvh flex-col">
      {promotions?.announcement_bars && promotions.announcement_bars.length > 0 && (
        <AnnouncementBar announcements={promotions.announcement_bars} />
      )}
      <Navbar />
      <main className="flex-1 animate-page-in">{children}</main>
      <Footer />
    </div>
  )
}
