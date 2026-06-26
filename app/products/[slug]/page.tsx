import { SiteShell } from "@/components/site-shell"
import { ProductDetail } from "@/components/product-detail"
import { ProductDetailJsonLd } from "@/components/product-detail"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-jsonld"
import { categoryUrl, productUrl, SITE_URL } from "@/lib/product-url"
import type { Metadata } from "next"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

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
      canonical: productUrl(product.slug),
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let productJson: Record<string, unknown> | null = null
  try {
    productJson = await getProduct(slug)
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
              { name: "Home", url: SITE_URL },
              { name: "Shop", url: `${SITE_URL}/products` },
              {
                name: (productJson as any).category?.name || "Product",
                url: (productJson as any).category
                  ? categoryUrl((productJson as any).category_id)
                  : productUrl((productJson as any).slug),
              },
              {
                name: (productJson as any).name as string,
                url: productUrl((productJson as any).slug),
              },
            ]}
          />
        </>
      )}
      <ProductDetail slug={slug} />
    </SiteShell>
  )
}
