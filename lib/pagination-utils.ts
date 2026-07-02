/**
 * Builds a compact pagination range of page numbers.
 *
 * For ≤7 pages: show all numbers.
 * For 7+ pages: show 1, a window around the current page, and the last page,
 * with "ellipsis" markers where gaps exist.
 *
 * @param current - The current active page (1-indexed).
 * @param total   - The total number of pages.
 * @returns An array of page numbers and "ellipsis" markers.
 *
 * @example
 *   getPageRange(1, 5)   // [1, 2, 3, 4, 5]
 *   getPageRange(1, 10)  // [1, 2, 3, 4, 5, "ellipsis", 10]
 *   getPageRange(5, 10)  // [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 *   getPageRange(8, 10)  // [1, "ellipsis", 6, 7, 8, 9, 10]
 */
export function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]

  if (current > 4) {
    pages.push("ellipsis")
  }

  let windowStart: number
  let windowEnd: number

  if (current <= 4) {
    windowStart = 2
    windowEnd = 5
  } else if (current >= total - 3) {
    windowStart = total - 4
    windowEnd = total - 1
  } else {
    windowStart = current - 1
    windowEnd = current + 1
  }

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i)
  }

  if (current < total - 3) {
    pages.push("ellipsis")
  }

  pages.push(total)

  return pages
}
