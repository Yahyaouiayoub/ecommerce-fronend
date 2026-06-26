import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Category } from "@/lib/types"
import { getImageUrl } from "@/lib/api/client"
import { StoreImage } from "@/components/store-image"
import { cn } from "@/lib/utils"
import { categoryPath } from "@/lib/product-url"

interface CategoryCardProps {
  category: Category
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const image = getImageUrl(category.image)

  return (
    <Link
      href={categoryPath(category.id)}
      className={cn(
        "group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <StoreImage
        src={image}
        alt={category.name}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div className="relative z-10 p-5">
        <h3 className="text-lg font-semibold text-background">
          {category.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-background/80">
          {category.products_count != null && (
            <span>{category.products_count} products</span>
          )}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
