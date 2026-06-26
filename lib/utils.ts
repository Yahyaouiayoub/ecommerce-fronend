import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProductVariant, AttributeGroup } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price value in USD.
 *
 * @param value - The price amount in USD
 *
 * @example
 *   formatPrice(24.50)         // "$24.50"
 *   formatPrice(100)           // "$100.00"
 */
export function formatPrice(value: number | string): string {
  const amount = Number(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Compute attribute groups (Color, Size, Storage, etc.) from a list of variants.
 * Replicates the PHP ProductVariant::getAttributeGroups() logic on the frontend.
 */
export function computeAttributeGroups(variants: ProductVariant[]): Record<string, AttributeGroup> {
  const groups: Record<string, AttributeGroup> = {}

  for (const variant of variants) {
    if (variant.color) {
      if (!groups["color"]) {
        groups["color"] = { label: "Color", options: {} }
      }
      groups["color"].options[variant.color] = {
        value: variant.color,
        variant_id: variant.id,
      }
    }
    if (variant.size) {
      if (!groups["size"]) {
        groups["size"] = { label: "Size", options: {} }
      }
      groups["size"].options[variant.size] = {
        value: variant.size,
        variant_id: variant.id,
      }
    }
    if (variant.storage) {
      if (!groups["storage"]) {
        groups["storage"] = { label: "Storage", options: {} }
      }
      groups["storage"].options[variant.storage] = {
        value: variant.storage,
        variant_id: variant.id,
      }
    }
    if (variant.attributes) {
      for (const [key, val] of Object.entries(variant.attributes)) {
        if (!groups[key]) {
          groups[key] = { label: key.charAt(0).toUpperCase() + key.slice(1), options: {} }
        }
        groups[key].options[val] = {
          value: val,
          variant_id: variant.id,
        }
      }
    }
  }

  return groups
}
