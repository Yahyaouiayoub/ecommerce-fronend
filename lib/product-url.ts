/**
 * Centralized product URL helpers.
 *
 * All navigation to product pages should go through these functions
 * so that URL structure is consistent across the entire app.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

/**
 * Return a relative path for a product detail page.
 * Use this in Next.js `<Link>` components to navigate to a product.
 *
 * @param slug - The product slug from the API (e.g. "smartphone-pro-max")
 *
 * @example
 *   // Inside a ProductCard or product listing component:
 *   <Link href={productPath(product.slug)}>
 *     {product.name}
 *   </Link>
 *   // → "/products/smartphone-pro-max"
 *
 * @example
 *   // Inside a cart item component:
 *   <Link href={productPath(item.slug)}>
 *     View product
 *   </Link>
 *   // → "/products/cotton-t-shirt"
 */
export function productPath(slug: string): string {
  return `/products/${slug}`
}

/**
 * Return an absolute URL for a product detail page.
 * Use this in sitemaps, `<head>` metadata, OpenGraph tags, Twitter cards, and JSON-LD structured data.
 *
 * @param slug - The product slug from the API (e.g. "smartphone-pro-max")
 *
 * @example
 *   // In a Next.js generateMetadata function:
 *   alternates: { canonical: productUrl(product.slug) }
 *   // → "http://localhost:3000/products/smartphone-pro-max"
 *
 * @example
 *   // In a sitemap generator:
 *   { url: productUrl(product.slug), priority: 0.8 }
 *   // → "http://localhost:3000/products/smartphone-pro-max"
 */
export function productUrl(slug: string): string {
  return `${SITE_URL}/products/${slug}`
}

/**
 * Return the absolute product URL with a safe fallback.
 * Use this in contexts where the product slug may be missing or nullable,
 * such as dynamically-typed data from JSON-LD or server-rendered content.
 *
 * @param slug - The product slug (optional). Falls back to ID-based URL when omitted or null.
 * @param id   - The product numeric ID (optional). Used only as a fallback when slug is missing.
 *
 * @example
 *   // In JSON-LD structured data where product comes from an API response:
 *   url: productUrlSafe((product as any).slug, product.id as number)
 *   // → "http://localhost:3000/products/smartphone-pro-max"  (slug present)
 *   // → "http://localhost:3000/products/42"                  (fallback to ID)
 *   // → "http://localhost:3000"                              (neither available)
 */
export function productUrlSafe(slug?: string | null, id?: number | null): string {
  if (slug) return `${SITE_URL}/products/${slug}`
  if (id) return `${SITE_URL}/products/${id}`
  return SITE_URL
}

// =========================
// CATEGORY URL HELPERS
// =========================

/**
 * Return a relative path to the products page filtered by category.
 * Use this in `<Link>` components throughout the app — category cards,
 * product detail breadcrumbs, footer navigation, etc.
 *
 * @param categoryId - Numeric ID or string of the category to filter by
 *
 * @example
 *   // Inside a CategoryCard:
 *   <Link href={categoryPath(category.id)}>
 *     {category.name}
 *   </Link>
 *   // → "/products?category_id=3"
 *
 * @example
 *   // In a product detail breadcrumb:
 *   { name: product.category.name, url: categoryPath(product.category.id) }
 *   // → "/products?category_id=3"
 */
export function categoryPath(categoryId: number | string): string {
  return `/products?category_id=${categoryId}`
}

/**
 * Return an absolute URL to the products page filtered by category.
 * Use this in sitemaps, SEO metadata, and canonical URL generation.
 *
 * @param categoryId - Numeric ID or string of the category to filter by
 *
 * @example
 *   // In a Next.js sitemap generator:
 *   { url: categoryUrl(cat.id), priority: 0.7 }
 *   // → "http://localhost:3000/products?category_id=3"
 *
 * @example
 *   // In a breadcrumb JSON-LD item:
 *   { name: "Electronics", url: categoryUrl(product.category_id) }
 *   // → "http://localhost:3000/products?category_id=5"
 */
export function categoryUrl(categoryId: number | string): string {
  return `${SITE_URL}/products?category_id=${categoryId}`
}
