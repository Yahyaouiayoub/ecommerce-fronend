import { describe, it, expect } from "vitest"
import { getPageRange } from "./pagination-utils"

describe("getPageRange", () => {
  // =========================
  // TOTAL <= 7 — no ellipsis
  // =========================
  describe("when total <= 7", () => {
    it("returns all pages for total = 1", () => {
      expect(getPageRange(1, 1)).toEqual([1])
    })

    it("returns all pages for total = 2", () => {
      expect(getPageRange(1, 2)).toEqual([1, 2])
      expect(getPageRange(2, 2)).toEqual([1, 2])
    })

    it("returns all pages for total = 7 (the boundary)", () => {
      expect(getPageRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
      expect(getPageRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
      expect(getPageRange(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })
  })

  // =========================
  // TOTAL > 7 — truncation kicks in
  // =========================
  describe("when total > 7", () => {
    // — Early pages (current <= 4): show 1 2 3 4 5 ... N
    describe("when current is near the start (current <= 4)", () => {
      it("shows 1-5 then ellipsis then N for current = 1", () => {
        expect(getPageRange(1, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
      })

      it("shows 1-5 then ellipsis then N for current = 2", () => {
        expect(getPageRange(2, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
      })

      it("shows 1-5 then ellipsis then N for current = 3", () => {
        expect(getPageRange(3, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
      })

      it("shows 1-5 then ellipsis then N for current = 4", () => {
        expect(getPageRange(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
      })
    })

    // — Middle pages: show 1 ... cur-1 cur cur+1 ... N
    describe("when current is in the middle", () => {
      it("shows 1 ... 4 5 6 ... 10 for current = 5", () => {
        expect(getPageRange(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
      })

      it("shows 1 ... 5 6 7 ... 10 for current = 6", () => {
        expect(getPageRange(6, 10)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 10])
      })
    })

    // — Late pages (current >= total - 3): show 1 ... N-4 N-3 N-2 N-1 N
    describe("when current is near the end (current >= total - 3)", () => {
      it("shows 1 ... 6 7 8 9 10 for current = 7", () => {
        expect(getPageRange(7, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
      })

      it("shows 1 ... 6 7 8 9 10 for current = 8", () => {
        expect(getPageRange(8, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
      })

      it("shows 1 ... 6 7 8 9 10 for current = 9", () => {
        expect(getPageRange(9, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
      })

      it("shows 1 ... 6 7 8 9 10 for current = 10", () => {
        expect(getPageRange(10, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
      })
    })
  })

  // =========================
  // BOUNDARY: total = 8
  // =========================
  describe("boundary total = 8", () => {
    it("current = 1: shows 1 2 3 4 5 ... 8", () => {
      expect(getPageRange(1, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis", 8])
    })

    it("current = 4: shows 1 2 3 4 5 ... 8", () => {
      expect(getPageRange(4, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis", 8])
    })

    it("current = 5: shows 1 ... 4 5 6 7 8 (no trailing ellipsis)", () => {
      expect(getPageRange(5, 8)).toEqual([1, "ellipsis", 4, 5, 6, 7, 8])
    })

    it("current = 8: shows 1 ... 4 5 6 7 8 (no trailing ellipsis)", () => {
      expect(getPageRange(8, 8)).toEqual([1, "ellipsis", 4, 5, 6, 7, 8])
    })
  })

  // =========================
  // BOUNDARY: total = 9
  // =========================
  describe("boundary total = 9", () => {
    it("current = 1: shows 1 2 3 4 5 ... 9", () => {
      expect(getPageRange(1, 9)).toEqual([1, 2, 3, 4, 5, "ellipsis", 9])
    })

    it("current = 5: shows 1 ... 4 5 6 ... 9", () => {
      expect(getPageRange(5, 9)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 9])
    })

    it("current = 6: shows 1 ... 5 6 7 8 9 (no trailing ellipsis)", () => {
      expect(getPageRange(6, 9)).toEqual([1, "ellipsis", 5, 6, 7, 8, 9])
    })

    it("current = 9: shows 1 ... 5 6 7 8 9 (no trailing ellipsis)", () => {
      expect(getPageRange(9, 9)).toEqual([1, "ellipsis", 5, 6, 7, 8, 9])
    })
  })

  // =========================
  // EDGE CASES
  // =========================
  describe("edge cases", () => {
    it("handles total = 0 (no pages)", () => {
      expect(getPageRange(1, 0)).toEqual([])
    })

    it("handles a very large total with current in middle", () => {
      const result = getPageRange(50, 100)
      expect(result[0]).toBe(1)
      expect(result[1]).toBe("ellipsis")
      expect(result[2]).toBe(49)
      expect(result[3]).toBe(50)
      expect(result[4]).toBe(51)
      expect(result[5]).toBe("ellipsis")
      expect(result[6]).toBe(100)
      expect(result).toHaveLength(7)
    })

    it("handles a very large total with current at start", () => {
      const result = getPageRange(1, 100)
      expect(result).toEqual([1, 2, 3, 4, 5, "ellipsis", 100])
    })

    it("handles a very large total with current at end", () => {
      const result = getPageRange(100, 100)
      expect(result).toEqual([1, "ellipsis", 96, 97, 98, 99, 100])
    })

    // Regression: ensure the window doesn't produce duplicates
    it("produces no duplicate page numbers", () => {
      for (let total = 1; total <= 20; total++) {
        for (let current = 1; current <= total; current++) {
          const range = getPageRange(current, total)
          const numbers = range.filter((x): x is number => x !== "ellipsis")
          expect(new Set(numbers).size).toBe(numbers.length)
        }
      }
    })

    // Regression: 1 and total are always present
    it("always includes the first and last page", () => {
      for (let total = 1; total <= 50; total++) {
        for (let current = 1; current <= total; current++) {
          const range = getPageRange(current, total)
          expect(range).toContain(1)
          expect(range).toContain(total)
        }
      }
    })
  })
})
