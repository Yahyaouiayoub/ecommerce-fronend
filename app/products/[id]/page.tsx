import { SiteShell } from "@/components/site-shell"
import { ProductDetail } from "@/components/product-detail"
import { ProductDetailJsonLd } from "@/components/product-detail"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld"
import type { Metadata } from "next"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product may no longer be available.",
    }
  }

  const imageUrl = product.thumbnail
    ? product.thumbnail.startsWith("http")
      ? product.thumbnail
      : `${process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage"}/${product.thumbnail}`
    : "/og-image.png"

  return {
    title: `${product.name}`,
    description: product.description?.slice(0, 160) ?? `${product.name} — ${product.price} MAD`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products/${product.id}`,
    },
    openGraph: {
      title: `${product.name} | Lumen`,
      description: product.description?.slice(0, 160) ?? `${product.name} — ${product.price} MAD`,
      type: "website",
      images: [{ url: imageUrl, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Lumen`,
      description: product.description?.slice(0, 160) ?? `${product.name} — ${product.price} MAD`,
      images: [imageUrl],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let productJson: Record<string, unknown> | null = null
  try {
    productJson = await getProduct(id)
  } catch {
    // Ignore — ProductDetail handles errors client-side
  }

  return (
    <SiteShell>
      {productJson && (
        <>
          <ProductDetailJsonLd product={productJson} />
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
              { name: "Shop", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products` },
              {
                name: (productJson as any).category?.name || "Product",
                url: (productJson as any).category
                  ? `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products?category_id=${(productJson as any).category_id}`
                  : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products/${productJson.id}`,
              },
              {
                name: (productJson as any).name as string,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products/${productJson.id}`,
              },
            ]}
          />
        </>
      )}
      <ProductDetail id={id} />
    </SiteShell>
  )
}