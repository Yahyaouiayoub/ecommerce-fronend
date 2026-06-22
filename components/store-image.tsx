"use client"

import Image from "next/image"
import { useState } from "react"
import { getImageUrl, isStorageUrl } from "@/lib/api/client"

interface StoreImageProps {
  src: string | undefined
  alt: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  className?: string
  priority?: boolean
  /**
   * When true, always uses Next.js Image Optimization regardless of source.
   * Defaults to false (storage images use plain <img> for speed).
   */
  forceOptimize?: boolean
}

const PLACEHOLDER = "/placeholder.svg"

/**
 * Optimized image component for the store frontend.
 *
 * Storage-served images (from `STORAGE_URL`) render as plain `<img>` tags
 * to skip Next.js Image Optimization — avoiding the serverless function
 * overhead and making product images load instantly on navigation.
 *
 * Use `forceOptimize` for images that benefit from optimization (e.g. hero banners).
 */
export function StoreImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  priority = false,
  forceOptimize = false,
}: StoreImageProps) {
  const [error, setError] = useState(false)
  const resolved = error ? PLACEHOLDER : getImageUrl(src)
  const isExternal = isStorageUrl(resolved) || resolved.startsWith("http")

  if (!forceOptimize && isExternal) {
    return (
      <img
        src={resolved}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setError(true)}
        className={className}
        style={
          fill
            ? { objectFit: "cover", position: "absolute", inset: 0, width: "100%", height: "100%" }
            : undefined
        }
      />
    )
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setError(true)}
    />
  )
}
