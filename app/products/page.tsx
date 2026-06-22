import { Suspense } from "react"
import { SiteShell } from "@/components/site-shell"
import { ProductsBrowser } from "@/components/products-browser"
import { ProductGridSkeleton } from "@/components/skeletons"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse our full collection of home, lifestyle and design products. Find the perfect piece for your space.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products`,
  },
  openGraph: {
    title: "Shop All Products | Lumen",
    description:
      "Browse our full collection of home, lifestyle and design products.",
  },
}

export default function ProductsPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <ProductGridSkeleton count={12} />
          </div>
        }
      >
        <ProductsBrowser />
      </Suspense>
    </SiteShell>
  )
}
