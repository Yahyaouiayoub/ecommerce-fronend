import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"
import type { Invoice } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

// Helvetica is a standard PDF base font — no registration needed.

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#171717",
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    paddingBottom: 24,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "column",
    gap: 4,
  },
  logo: {
    width: 120,
    height: "auto",
    maxHeight: 48,
    marginBottom: 4,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#171717",
  },
  companyAddress: {
    fontSize: 9,
    color: "#404040",
    lineHeight: 1.6,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 26,
    fontWeight: 300,
    letterSpacing: 4,
    color: "#171717",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontFamily: "Courier",
    fontSize: 12,
    color: "#262626",
  },
  statusBadge: {
    marginTop: 6,
    padding: "2px 10px",
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    color: "#171717",
  },
  statusBadgePaid: {
    backgroundColor: "#171717",
    color: "#ffffff",
    borderColor: "#171717",
  },
  statusBadgeCancelled: {
    textDecoration: "line-through",
    color: "#525252",
  },
  // Metadata
  metadataTable: {
    flexDirection: "row",
    marginBottom: 24,
  },
  metadataCell: {
    flex: 1,
    paddingRight: 16,
  },
  metadataLabel: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#404040",
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 10,
    fontFamily: "Courier",
  },
  // Section title
  sectionTitle: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#404040",
    marginBottom: 8,
  },
  // Bill To + Amount side by side
  infoGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  billName: {
    fontWeight: 600,
    color: "#171717",
    fontSize: 11,
    marginBottom: 2,
  },
  billDetail: {
    color: "#404040",
    fontSize: 10,
    lineHeight: 1.6,
  },
  amountTotal: {
    fontSize: 18,
    fontWeight: 600,
    color: "#171717",
  },
  dueDate: {
    fontSize: 9,
    color: "#525252",
    marginTop: 2,
  },
  // Products table
  productsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    paddingVertical: 6,
    marginBottom: 0,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#404040",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 7,
  },
  tableCell: {
    fontSize: 10,
    color: "#171717",
  },
  productName: {
    fontWeight: 500,
  },
  colProduct: { width: "50%" },
  colQty: { width: "15%", textAlign: "center" as const },
  colPrice: { width: "17.5%", textAlign: "right" as const },
  colTotal: { width: "17.5%", textAlign: "right" as const },
  // Totals
  totalsSection: {
    width: 260,
    marginLeft: "auto",
    marginBottom: 20,
  },
  totalsRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  totalsLabel: {
    flex: 1,
    textAlign: "left" as const,
    color: "#404040",
    fontSize: 10,
  },
  totalsValue: {
    textAlign: "right" as const,
    color: "#171717",
    fontSize: 10,
  },
  totalsSeparator: {
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
    marginVertical: 0,
    height: 0,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  totalLabel: {
    flex: 1,
    fontWeight: 600,
    fontSize: 13,
    color: "#171717",
  },
  totalValue: {
    textAlign: "right" as const,
    fontWeight: 600,
    fontSize: 13,
    color: "#171717",
  },
  balanceLabel: {
    flex: 1,
    fontWeight: 600,
    fontSize: 12,
    color: "#171717",
  },
  balanceValue: {
    textAlign: "right" as const,
    fontWeight: 600,
    fontSize: 12,
    color: "#171717",
  },
  paidLabel: {
    flex: 1,
    color: "#525252",
    fontSize: 10,
  },
  paidValue: {
    textAlign: "right" as const,
    color: "#525252",
    fontSize: 10,
  },
  // Payments
  paymentSection: {
    marginBottom: 20,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 6,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#a3a3a3",
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: "#171717",
  },
  paymentDate: {
    fontSize: 8,
    color: "#525252",
  },
  paymentAmount: {
    fontSize: 10,
    fontWeight: 600,
    color: "#171717",
  },
  // Notes
  notes: {
    marginBottom: 20,
  },
  notesText: {
    fontSize: 10,
    color: "#404040",
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
    paddingTop: 12,
    marginTop: 24,
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: 8,
    color: "#525252",
    lineHeight: 1.6,
  },
})

interface InvoicePDFProps {
  invoice: Invoice
  meta?: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  companySettings?: {
    company_name: string
    company_address: string
    company_city: string
    company_country: string
    company_phone?: string
    company_email?: string
  }
  logoUrl?: string
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getStatusStyle(status: string) {
  if (status === "paid") return styles.statusBadgePaid
  if (status === "cancelled" || status === "refunded") return styles.statusBadgeCancelled
  return {}
}

export function InvoicePDFDocument({ invoice, meta, companySettings, logoUrl }: InvoicePDFProps) {
  const items = invoice.order?.items ?? []
  const payments = invoice.payments ?? []
  const company = companySettings ?? {
    company_name: "Lumen Store",
    company_address: "123 Commerce Street",
    company_city: "Casablanca",
    company_country: "Morocco",
  }

  const subtotal = meta?.subtotal ?? (items.length > 0
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0)
  const shipping = meta?.shipping ?? 0
  const tax = meta?.tax ?? 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl ? (
              <Image style={styles.logo} src={{ uri: logoUrl }} />
            ) : (
              <Text style={styles.companyName}>{company.company_name}</Text>
            )}
            <Text style={styles.companyAddress}>
              {company.company_address}{"\n"}
              {company.company_city}, {company.company_country}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            {invoice.status && (
              <Text style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
                {invoice.status_label ?? invoice.status.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* METADATA */}
        <View style={styles.metadataTable}>
          <View style={styles.metadataCell}>
            <Text style={styles.metadataLabel}>Invoice #</Text>
            <Text style={styles.metadataValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.metadataCell}>
            <Text style={styles.metadataLabel}>Order #</Text>
            <Text style={styles.metadataValue}>{invoice.order?.order_number ?? `#${invoice.order_id}`}</Text>
          </View>
          <View style={styles.metadataCell}>
            <Text style={styles.metadataLabel}>Date</Text>
            <Text style={styles.metadataValue}>{formatDate(invoice.issued_at ?? invoice.created_at)}</Text>
          </View>
          <View style={styles.metadataCell}>
            <Text style={styles.metadataLabel}>Status</Text>
            <Text>{invoice.status_label ?? invoice.status}</Text>
          </View>
        </View>

        {/* BILL TO + AMOUNT */}
        <View style={styles.infoGrid}>
          <View style={styles.infoLeft}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.billName}>
              {invoice.billing_name ?? invoice.order?.customer?.full_name ?? "N/A"}
            </Text>
            {invoice.billing_email && <Text style={styles.billDetail}>{invoice.billing_email}</Text>}
            {invoice.billing_phone && <Text style={styles.billDetail}>{invoice.billing_phone}</Text>}
            {invoice.billing_address && (
              <Text style={[styles.billDetail, { marginTop: 4 }]}>{invoice.billing_address}</Text>
            )}
            {invoice.order?.address && !invoice.billing_address && (
              <Text style={[styles.billDetail, { marginTop: 4 }]}>
                {invoice.order.address.full_name}{"\n"}
                {invoice.order.address.address_line1}
                {invoice.order.address.address_line2 ? `\n${invoice.order.address.address_line2}` : ""}
                {"\n"}
                {invoice.order.address.city}
                {invoice.order.address.state ? `, ${invoice.order.address.state}` : ""}
                {" "}{invoice.order.address.postal_code}
                {"\n"}
                {invoice.order.address.country}
              </Text>
            )}
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.amountTotal}>{formatPrice(invoice.total_amount)}</Text>
            {invoice.due_date && (
              <Text style={styles.dueDate}>Due {formatShortDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* PRODUCTS TABLE */}
        {items.length > 0 && (
          <View style={styles.productsTable}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Products</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Product</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>

            {/* Table Rows */}
            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colProduct, styles.productName]}>
                  {item.product_name}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{item.price_formatted ?? formatPrice(item.price)}</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {item.subtotal_formatted ?? formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* TOTALS */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatPrice(subtotal)}</Text>
          </View>
          {shipping > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Shipping</Text>
              <Text style={styles.totalsValue}>{formatPrice(shipping)}</Text>
            </View>
          )}
          {tax > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{formatPrice(tax)}</Text>
            </View>
          )}
          <View style={styles.totalsSeparator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(invoice.total_amount)}</Text>
          </View>
          {invoice.paid_amount > 0 && (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.paidLabel}>Paid</Text>
                <Text style={styles.paidValue}>− {formatPrice(invoice.paid_amount)}</Text>
              </View>
              <View style={styles.totalsSeparator} />
              <View style={styles.totalRow}>
                <Text style={styles.balanceLabel}>Balance Due</Text>
                <Text style={styles.balanceValue}>
                  {invoice.remaining_amount > 0 ? formatPrice(invoice.remaining_amount) : "$0.00"}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* PAYMENT HISTORY */}
        {payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {[...payments]
              .sort((a, b) => new Date(b.paid_at ?? b.created_at).getTime() - new Date(a.paid_at ?? a.created_at).getTime())
              .map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentLeft}>
                    <View style={styles.paymentDot} />
                    <View>
                      <Text style={styles.paymentLabel}>{payment.payment_type_label}</Text>
                      <Text style={styles.paymentDate}>
                        {formatShortDate(payment.paid_at ?? payment.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.paymentAmount}>{payment.amount_formatted}</Text>
                </View>
              ))}
          </View>
        )}

        {/* NOTES */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business</Text>
          <Text style={styles.footerText}>
            {company.company_name}
            {company.company_email ? ` · ${company.company_email}` : ""}
            {company.company_phone ? ` · ${company.company_phone}` : ""}
          </Text>
          <Text style={styles.footerText}>
            {company.company_address}, {company.company_city}, {company.company_country}
          </Text>
          <Text style={[styles.footerText, { marginTop: 3, fontSize: 7 }]}>
            Generated {formatDate(invoice.created_at)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
