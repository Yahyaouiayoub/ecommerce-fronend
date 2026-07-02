import { describe, it, expect, beforeEach } from "vitest"
import { getImageUrl, isStorageUrl } from "./client"

// The module uses `STORAGE_URL` from `process.env.NEXT_PUBLIC_STORAGE_URL`
// with a fallback of "http://localhost:8000/storage".
// These tests use the default fallback since env vars aren't set in tests.

describe("getImageUrl", () => {
  // =========================
  // NULL / UNDEFINED INPUTS
  // =========================
  describe("when path is nullish", () => {
    it("returns placeholder for undefined", () => {
      expect(getImageUrl(undefined)).toBe("/placeholder.svg")
    })

    it("returns placeholder for empty string", () => {
      expect(getImageUrl("")).toBe("/placeholder.svg")
    })
  })

  // =========================
  // FAKE / KNOWN BAD PATHS
  // =========================
  describe("when path is a known fake path", () => {
    it('returns placeholder for "/product.jpg"', () => {
      expect(getImageUrl("/product.jpg")).toBe("/placeholder.svg")
    })
  })

  // =========================
  // ABSOLUTE URLS
  // =========================
  describe("when path is an absolute URL", () => {
    it("returns https URL as-is", () => {
      const url = "https://cdn.example.com/images/product.jpg"
      expect(getImageUrl(url)).toBe(url)
    })

    it("returns http URL as-is", () => {
      const url = "http://cdn.example.com/images/product.jpg"
      expect(getImageUrl(url)).toBe(url)
    })

    it("returns URL with port as-is", () => {
      const url = "http://localhost:8000/storage/products/thumb.jpg"
      expect(getImageUrl(url)).toBe(url)
    })

    it("returns URL with query params as-is", () => {
      const url = "https://images.example.com/img.jpg?w=800&q=75"
      expect(getImageUrl(url)).toBe(url)
    })
  })

  // =========================
  // /storage/ PREFIX
  // =========================
  describe('when path starts with "/storage/"', () => {
    it("strips /storage/ prefix and prepends STORAGE_URL", () => {
      // /storage/products/abc.jpg → http://localhost:8000/storage/products/abc.jpg
      expect(getImageUrl("/storage/products/abc.jpg")).toBe(
        "http://localhost:8000/storage/products/abc.jpg",
      )
    })

    it("handles nested paths under /storage/", () => {
      expect(getImageUrl("/storage/promotions/hero-banners/summer.jpg")).toBe(
        "http://localhost:8000/storage/promotions/hero-banners/summer.jpg",
      )
    })

    it("handles filenames with special characters", () => {
      expect(getImageUrl("/storage/products/my-image_123.webp")).toBe(
        "http://localhost:8000/storage/products/my-image_123.webp",
      )
    })
  })

  // =========================
  // ROOT-RELATIVE PATHS (starting with / but not /storage/)
  // =========================
  describe("when path starts with / (but not /storage/)", () => {
    it("prepends STORAGE_URL to a root-relative path", () => {
      expect(getImageUrl("/images/logo.png")).toBe(
        "http://localhost:8000/storage/images/logo.png",
      )
    })

    it("handles path with subdirectories", () => {
      expect(getImageUrl("/uploads/2026/07/product.jpg")).toBe(
        "http://localhost:8000/storage/uploads/2026/07/product.jpg",
      )
    })
  })

  // =========================
  // RELATIVE PATHS (no leading slash)
  // =========================
  describe("when path is relative (no leading slash)", () => {
    it("prepends STORAGE_URL with a forward slash", () => {
      expect(getImageUrl("products/thumbnails/abc.jpg")).toBe(
        "http://localhost:8000/storage/products/thumbnails/abc.jpg",
      )
    })

    it("handles single-segment relative paths", () => {
      expect(getImageUrl("logo.png")).toBe(
        "http://localhost:8000/storage/logo.png",
      )
    })
  })

  // =========================
  // isStorageUrl
  // =========================
  describe("isStorageUrl", () => {
    it("returns true for URLs pointing to the local storage server", () => {
      expect(
        isStorageUrl("http://localhost:8000/storage/products/abc.jpg"),
      ).toBe(true)
    })

    it("returns false for external CDN URLs", () => {
      expect(isStorageUrl("https://cdn.example.com/image.jpg")).toBe(false)
    })

    it("returns false for absolute HTTPS URLs", () => {
      expect(isStorageUrl("https://images.example.com/img.jpg")).toBe(false)
    })

    it("returns false for placeholder paths", () => {
      expect(isStorageUrl("/placeholder.svg")).toBe(false)
    })

    it("returns false for empty string", () => {
      expect(isStorageUrl("")).toBe(false)
    })
  })
})
