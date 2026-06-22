/** BreadcrumbList JSON-LD structured data for SEO. */
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const script = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}
