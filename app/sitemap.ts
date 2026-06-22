import type { MetadataRoute } from "next"
import { api } from "@/lib/api/client"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/cart`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  try {
    // Fetch categories for dynamic category pages
    const { data: categories } = await api.get<{ slug: string; updated_at: string }[]>("/categories", {
      timeout: 5000,
    })

    if (Array.isArray(categories)) {
      for (const cat of categories) {
        staticPages.push({
          url: `${BASE_URL}/products?category_id=${(cat as any).id}`,
          lastModified: new Date((cat as any).updated_at ?? new Date()),
          changeFrequency: "daily",
          priority: 0.7,
        })
      }
    }
  } catch {
    // Silently fail — sitemap still works with static pages
  }

  try {
    // Fetch product IDs for dynamic product detail pages
    const { data: productsPage } = await api.get<{ data: { id: number; slug: string; updated_at: string }[] }>("/products", {
      params: { per_page: 100 },
      timeout: 5000,
    })

    if (productsPage?.data) {
      for (const product of productsPage.data) {
        staticPages.push({
          url: `${BASE_URL}/products/${product.id}`,
          lastModified: new Date(product.updated_at ?? new Date()),
          changeFrequency: "weekly",
          priority: 0.8,
        })
      }
    }
  } catch {
    // Silently fail
  }

  return staticPages
}
