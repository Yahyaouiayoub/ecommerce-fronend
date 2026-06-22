import { api, getToken } from "./api/client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

/**
 * Preview a PDF in a new tab.
 * Uses the auth token as a query parameter since window.open can't set headers.
 */
export function openPdfInNewTab(url: string) {
  const token = getToken()
  const separator = url.includes("?") ? "&" : "?"
  const fullUrl = `${API_URL}${url}${separator}token=${encodeURIComponent(token ?? "")}`
  window.open(fullUrl, "_blank")
}

/**
 * Download a PDF as a file using the axios API client (includes Bearer token via interceptor).
 */
export async function downloadPdf(url: string, filename: string) {
  try {
    const response = await api.get(url, { responseType: "blob" })

    const blob = response.data as Blob
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error("PDF download failed:", error)
    const message =
      error && typeof error === "object" && "response" in error
        ? (error as { response: { status: number } }).response.status === 401
          ? "Session expired. Please log in again."
          : "Failed to download PDF. Check your connection and try again."
        : "Failed to download PDF. Check your connection and try again."
    throw new Error(message)
  }
}
