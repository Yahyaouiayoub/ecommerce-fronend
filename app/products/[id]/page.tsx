import { SiteShell } from "@/components/site-shell"
import { ProductDetail } from "@/components/product-detail"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <SiteShell>
      <ProductDetail id={id} />
    </SiteShell>
  )
}