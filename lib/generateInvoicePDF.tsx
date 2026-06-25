import { pdf } from "@react-pdf/renderer"
import type { Invoice } from "@/lib/types"
import { InvoicePDFDocument } from "@/components/invoice/InvoicePDF"

interface CompanySettings {
  company_name: string
  company_address: string
  company_city: string
  company_country: string
  company_phone?: string
  company_email?: string
}

interface InvoiceMeta {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

/**
 * Generate a PDF blob from invoice data using @react-pdf/renderer.
 */
export async function generateInvoicePdfBlob(
  invoice: Invoice,
  meta?: InvoiceMeta,
  companySettings?: CompanySettings,
  logoUrl?: string,
): Promise<Blob> {
  const doc = (
    <InvoicePDFDocument
      invoice={invoice}
      meta={meta}
      companySettings={companySettings}
      logoUrl={logoUrl}
    />
  )
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  return blob
}

/**
 * Preview an invoice PDF in a new tab.
 */
export async function previewInvoicePdf(
  invoice: Invoice,
  meta?: InvoiceMeta,
  companySettings?: CompanySettings,
  logoUrl?: string,
): Promise<void> {
  const blob = await generateInvoicePdfBlob(invoice, meta, companySettings, logoUrl)
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
  // Revoke after a delay to give the browser time to open it
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Download an invoice PDF file.
 */
export async function downloadInvoicePdf(
  invoice: Invoice,
  meta?: InvoiceMeta,
  companySettings?: CompanySettings,
  logoUrl?: string,
): Promise<void> {
  const blob = await generateInvoicePdfBlob(invoice, meta, companySettings, logoUrl)
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `invoice-${invoice.invoice_number}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}
