"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { ProductVariant, AttributeGroup } from "@/lib/types"
import { cn, computeAttributeGroups } from "@/lib/utils"

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  onVariantChange: (variant: ProductVariant | null) => void
}

export function ProductVariantSelector({ variants, onVariantChange }: ProductVariantSelectorProps) {
  const attributeGroups = useMemo<Record<string, AttributeGroup>>(
    () => computeAttributeGroups(variants),
    [variants],
  )

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  // Auto-select default variant on load
  useEffect(() => {
    if (variants.length === 0) {
      onVariantChange(null)
      return
    }

    const defaultVariant = variants.find((v) => v.is_default) ?? variants[0]
    setSelectedVariantId(defaultVariant.id)

    // Set default attribute selections
    const defaults: Record<string, string> = {}
    const groupNames = Object.keys(attributeGroups)
    for (const groupName of groupNames) {
      const options = Object.values(attributeGroups[groupName].options)
      const matchingOption = options.find((o: any) => o.variant_id === defaultVariant.id)
      if (matchingOption) {
        defaults[groupName] = matchingOption.value
      } else if (options.length > 0) {
        defaults[groupName] = options[0].value
      }
    }
    setSelectedAttributes(defaults)
  }, [variants, attributeGroups, onVariantChange])

  // Find matching variant when attributes change
  useEffect(() => {
    if (variants.length === 0) return

    const attrValues = Object.values(selectedAttributes)
    if (attrValues.length === 0) return

    // Find the variant matching ALL selected attributes
    const matched = variants.find((v) => {
      const variantAttrs: string[] = []
      if (v.color) variantAttrs.push(v.color)
      if (v.size) variantAttrs.push(v.size)
      if (v.storage) variantAttrs.push(v.storage)
      if (v.attributes) {
        for (const val of Object.values(v.attributes)) {
          if (typeof val === "string") variantAttrs.push(val)
        }
      }
      return attrValues.every((a) => variantAttrs.includes(a))
    })

    const newVariantId = matched?.id ?? null
    if (newVariantId !== selectedVariantId) {
      setSelectedVariantId(newVariantId)
      onVariantChange(matched ?? null)
    }
  }, [selectedAttributes, variants, selectedVariantId, onVariantChange])

  const handleAttributeChange = useCallback((group: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [group]: value }))
  }, [])

  if (variants.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {Object.entries(attributeGroups).map(([groupKey, group]: [string, any]) => (
        <div key={groupKey}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {group.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(group.options).map(([optionValue, option]: [string, any]) => {
              const isSelected = selectedAttributes[groupKey] === optionValue
              const isAvailable = Object.values(variants).some(
                (v: any) => {
                  const vAttr = groupKey === "color" ? v.color : groupKey === "size" ? v.size : groupKey === "storage" ? v.storage : v.attributes?.[groupKey]
                  return vAttr === optionValue
                },
              )
              const isOutOfStock = !Object.values(variants).some(
                (v: any) => {
                  const vAttr = groupKey === "color" ? v.color : groupKey === "size" ? v.size : groupKey === "storage" ? v.storage : v.attributes?.[groupKey]
                  return vAttr === optionValue && v.stock > 0
                },
              )

              return (
                <button
                  key={optionValue}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleAttributeChange(groupKey, optionValue)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                      : "border-border bg-background text-foreground hover:border-accent/50 hover:bg-accent/5",
                    !isAvailable && "cursor-not-allowed opacity-40 line-through",
                    isOutOfStock && isAvailable && "opacity-60",
                  )}
                >
                  {optionValue}
                  {isOutOfStock && isAvailable && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">(sold out)</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
