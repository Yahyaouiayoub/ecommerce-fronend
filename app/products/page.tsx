import { Suspense } from "react"
import { SiteShell } from "@/components/site-shell"
import { ProductsBrowser } from "@/components/products-browser"
import { ProductGridSkeleton } from "@/components/skeletons"

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
