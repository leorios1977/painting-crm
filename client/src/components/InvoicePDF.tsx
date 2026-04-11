import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Invoice, InvoiceLineItem } from "../../../drizzle/schema";

interface InvoicePDFProps {
  invoice: Invoice & { lead?: { firstName: string; lastName: string; projectAddress?: string; email?: string; phone?: string } };
  branding: {
    businessName: string;
    logoUrl?: string | null;
    primaryColor?: string;
    companyEmail?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 20,
  },
  logoSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  businessName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#6b7280",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  twoColumn: {
    display: "flex",
    flexDirection: "row",
    gap: 40,
    marginBottom: 25,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: "#1f2937",
    marginBottom: 8,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 10,
    color: "#1f2937",
  },
  descriptionCell: {
    flex: 2,
  },
  quantityCell: {
    flex: 1,
    textAlign: "center" as const,
  },
  priceCell: {
    flex: 1,
    textAlign: "right" as const,
  },
  amountCell: {
    flex: 1,
    textAlign: "right" as const,
  },
  totalsSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
  },
  totalRow: {
    display: "flex",
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  totalAmount: {
    fontSize: 11,
    color: "#1f2937",
    fontWeight: "bold",
  },
  grandTotal: {
    display: "flex",
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#1f2937",
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
  },
  grandTotalAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center" as const,
  },
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, branding }) => {
  const lineItems = (invoice.lineItems as InvoiceLineItem[]) || [];
  const subtotal = parseFloat(invoice.subtotal.toString());
  const tax = parseFloat(invoice.tax.toString());
  const total = parseFloat(invoice.total.toString());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {branding.logoUrl && (
              <Image src={branding.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.businessName}>{branding.businessName}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {invoice.lead && (
              <>
                <Text style={styles.value}>
                  {invoice.lead.firstName} {invoice.lead.lastName}
                </Text>
                {invoice.lead.projectAddress && (
                  <Text style={styles.value}>{invoice.lead.projectAddress}</Text>
                )}
                {invoice.lead.email && (
                  <Text style={styles.value}>{invoice.lead.email}</Text>
                )}
                {invoice.lead.phone && (
                  <Text style={styles.value}>{invoice.lead.phone}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.label}>Invoice Number</Text>
              <Text style={styles.value}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.descriptionCell]}>
              Description
            </Text>
            <Text style={[styles.tableCell, styles.quantityCell]}>Qty</Text>
            <Text style={[styles.tableCell, styles.priceCell]}>Unit Price</Text>
            <Text style={[styles.tableCell, styles.amountCell]}>Amount</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCell]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.quantityCell]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.priceCell]}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell]}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(subtotal)}</Text>
          </View>
          {tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(tax)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalAmount}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {branding.businessName}
            {branding.companyEmail && ` • ${branding.companyEmail}`}
          </Text>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};
