/**
 * invoices.ts — Invoice generation, sending, and payment tracking service
 *
 * Provides:
 *   generateInvoice()   — Create a draft invoice with line items and calculated totals
 *   sendInvoice()       — Generate a Stripe Payment Link, send it via SMS, mark invoice as "sent"
 *   markInvoicePaid()   — Mark invoice as paid (called from webhook or manual action)
 *
 * Stripe integration mirrors the existing stripe.ts router pattern.
 * SMS delivery uses the existing sms.ts service.
 */

import { getDb } from "../db";
import { invoices, leads, communicationLog } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";
import { sendSMS } from "./sms";
import { generatePortalToken, buildPortalUrl } from "./portal";
import type { Invoice, InsertInvoice, InvoiceLineItem } from "../../drizzle/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateInvoiceInput {
  leadId: number;
  lineItems: InvoiceLineItem[];
  taxRate?: number; // percentage, e.g. 8.5 for 8.5%
  dueDate?: Date;
  notes?: string;
  createdBy?: number;
}

export interface SendInvoiceInput {
  invoiceId: number;
  sendSmsToCustomer?: boolean;
  createdBy?: number;
}

export interface InvoiceServiceResult {
  invoice: Invoice;
  stripeUrl?: string;
  smsSent?: boolean;
  smsError?: string;
  mock?: boolean;
}

// ─── Invoice number generator ─────────────────────────────────────────────────

async function getNextInvoiceNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return `INV-${Date.now()}`;

  const rows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .orderBy(desc(invoices.id))
    .limit(1);

  const nextId = rows.length > 0 ? (rows[0].id + 1) : 1;
  return `INV-${String(nextId).padStart(4, "0")}`;
}

// ─── Core service functions ───────────────────────────────────────────────────

/**
 * Creates a draft invoice with calculated subtotal, tax, and total.
 * Does NOT send anything — call sendInvoice() to deliver it.
 */
export async function generateInvoice(
  input: GenerateInvoiceInput
): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate lead exists
  const leadRows = await db
    .select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName })
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);
  if (!leadRows[0]) throw new Error(`Lead ${input.leadId} not found`);

  if (!input.lineItems || input.lineItems.length === 0) {
    throw new Error("At least one line item is required");
  }

  // Calculate totals
  const subtotal = input.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = input.taxRate ?? 0;
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const invoiceNumber = await getNextInvoiceNumber();

  await db.insert(invoices).values({
    leadId: input.leadId,
    invoiceNumber,
    lineItems: input.lineItems as unknown as InsertInvoice["lineItems"],
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    status: "draft",
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
    smsSent: false,
    createdBy: input.createdBy ?? null,
  } satisfies InsertInvoice);

  // Fetch the newly created invoice
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.leadId, input.leadId))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  const invoice = rows[0];
  if (!invoice) throw new Error("Failed to retrieve created invoice");

  // Log creation
  try {
    await db.insert(communicationLog).values({
      leadId: input.leadId,
      type: "system",
      direction: "internal",
      subject: `Invoice created: ${invoiceNumber}`,
      content: `Draft invoice ${invoiceNumber} created for $${total.toFixed(2)} (${input.lineItems.length} line item${input.lineItems.length !== 1 ? "s" : ""}).`,
      sentBy: input.createdBy ?? null,
    });
  } catch (e) {
    console.warn("[Invoices] Failed to log invoice creation:", (e as Error).message);
  }

  return invoice;
}

/**
 * Sends an invoice to the customer:
 *   1. Creates a Stripe Payment Link for the invoice total
 *   2. Sends the link via SMS to the customer's phone
 *   3. Updates invoice status to "sent"
 *
 * Falls back to a mock URL if Stripe is not configured.
 */
export async function sendInvoice(
  input: SendInvoiceInput
): Promise<InvoiceServiceResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch the invoice
  const invRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, input.invoiceId))
    .limit(1);
  const invoice = invRows[0];
  if (!invoice) throw new Error(`Invoice ${input.invoiceId} not found`);

  // Fetch the lead
  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, invoice.leadId))
    .limit(1);
  const lead = leadRows[0];
  if (!lead) throw new Error(`Lead ${invoice.leadId} not found`);

  const totalAmount = parseFloat(String(invoice.total));
  let stripeUrl: string | undefined;
  let stripePaymentLinkId: string | undefined;
  let isMock = false;

  // ── Generate Stripe Payment Link ───────────────────────────────────────────
  const stripeKey = ENV.stripeSecretKey;
  if (!stripeKey) {
    // Mock mode — no real Stripe key configured
    stripeUrl = `https://buy.stripe.com/test_mock_inv${invoice.id}_${Date.now()}`;
    isMock = true;
  } else {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);

      // Build line items for Stripe from the invoice line items
      const lineItems = invoice.lineItems as unknown as InvoiceLineItem[];
      const stripeLineItems = lineItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.description },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      }));

      // Add tax as a separate line item if applicable
      const taxAmount = parseFloat(String(invoice.tax));
      if (taxAmount > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: "Tax" },
            unit_amount: Math.round(taxAmount * 100),
          },
          quantity: 1,
        });
      }

      const paymentLink = await stripe.paymentLinks.create({
        line_items: stripeLineItems,
        metadata: {
          invoiceId: String(invoice.id),
          invoiceNumber: invoice.invoiceNumber,
          leadId: String(invoice.leadId),
        },
      });

      stripeUrl = paymentLink.url;
      stripePaymentLinkId = paymentLink.id;
    } catch (err) {
      throw new Error(`Stripe error: ${(err as Error).message}`);
    }
  }

  // ── Update invoice record ──────────────────────────────────────────────────
  await db
    .update(invoices)
    .set({
      status: "sent",
      stripePaymentLink: stripeUrl,
      stripePaymentLinkId: stripePaymentLinkId ?? null,
    })
    .where(eq(invoices.id, invoice.id));

  // ── Send SMS with payment link ─────────────────────────────────────────────
  let smsSent = false;
  let smsError: string | undefined;

  if (input.sendSmsToCustomer !== false && lead.phone) {
    try {
      // Generate (or retrieve) the portal token so we can include the portal link
      let portalUrl = "";
      try {
        const portalToken = await generatePortalToken(lead.id);
        portalUrl = buildPortalUrl(portalToken, ENV.appUrl ?? "");
      } catch (e) {
        console.warn("[Invoices] Could not generate portal token for SMS:", (e as Error).message);
      }

      const smsBody =
        `Hi ${lead.firstName}! Your invoice ${invoice.invoiceNumber} for $${totalAmount.toFixed(2)} is ready. ` +
        `Pay securely here: ${stripeUrl}` +
        (portalUrl ? ` | View your project portal: ${portalUrl}` : "") +
        (isMock ? " (test link)" : "");

      const smsResult = await sendSMS(smsBody, lead.phone, invoice.leadId);
      smsSent = smsResult.success;
      if (!smsResult.success) smsError = smsResult.error;

      // Update smsSent flag on invoice
      if (smsSent) {
        await db
          .update(invoices)
          .set({ smsSent: true })
          .where(eq(invoices.id, invoice.id));
      }
    } catch (err) {
      smsError = (err as Error).message;
      console.error("[Invoices] SMS send failed:", smsError);
    }
  }

  // ── Log the send action ────────────────────────────────────────────────────
  try {
    await db.insert(communicationLog).values({
      leadId: invoice.leadId,
      type: "system",
      direction: "outbound",
      subject: `Invoice ${invoice.invoiceNumber} sent`,
      content:
        `Invoice ${invoice.invoiceNumber} for $${totalAmount.toFixed(2)} sent. ` +
        `Payment link: ${stripeUrl}. ` +
        `SMS: ${smsSent ? "delivered" : smsError ? `failed (${smsError})` : "not sent (no phone)"}. ` +
        (isMock ? "Stripe mock mode — configure STRIPE_SECRET_KEY for real payments." : ""),
      sentBy: input.createdBy ?? null,
    });
  } catch (e) {
    console.warn("[Invoices] Failed to log send action:", (e as Error).message);
  }

  // Return updated invoice
  const updatedRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoice.id))
    .limit(1);

  return {
    invoice: updatedRows[0] ?? invoice,
    stripeUrl,
    smsSent,
    smsError,
    mock: isMock,
  };
}

/**
 * Marks an invoice as paid and updates the associated lead to "paid" stage.
 * Called from the Stripe webhook or manually from the UI.
 */
export async function markInvoicePaid(
  invoiceId: number,
  stripeSessionId?: string,
  paidBy?: number
): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paidAt = new Date();

  await db
    .update(invoices)
    .set({
      status: "paid",
      paidAt,
      stripeSessionId: stripeSessionId ?? null,
    })
    .where(eq(invoices.id, invoiceId));

  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  const invoice = rows[0];
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found after update`);

  // Also update the lead stage to "paid"
  try {
    await db
      .update(leads)
      .set({ stage: "paid", paidAt })
      .where(eq(leads.id, invoice.leadId));
  } catch (e) {
    console.warn("[Invoices] Failed to update lead stage to paid:", (e as Error).message);
  }

  // Log the payment
  try {
    await db.insert(communicationLog).values({
      leadId: invoice.leadId,
      type: "system",
      direction: "internal",
      subject: `Payment received: ${invoice.invoiceNumber}`,
      content:
        `Invoice ${invoice.invoiceNumber} marked as paid ($${invoice.total}). ` +
        (stripeSessionId ? `Stripe session: ${stripeSessionId}.` : "Marked manually."),
      sentBy: paidBy ?? null,
    });
  } catch (e) {
    console.warn("[Invoices] Failed to log payment:", (e as Error).message);
  }

  return invoice;
}

/**
 * Marks overdue invoices (sent but past due date) — can be called by a cron job.
 * Returns the number of invoices updated.
 */
export async function markOverdueInvoices(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  // Initial broad update (refined below with due date check)
  await db
    .update(invoices)
    .set({ status: "overdue" })
    .where(eq(invoices.status, "sent"));

  // More precise: fetch sent invoices with past due dates and update them
  const overdueRows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.status, "sent"));

  let updated = 0;
  for (const row of overdueRows) {
    const inv = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, row.id))
      .limit(1);
    const invoice = inv[0];
    if (invoice?.dueDate && invoice.dueDate < now) {
      await db
        .update(invoices)
        .set({ status: "overdue" })
        .where(eq(invoices.id, invoice.id));
      updated++;
    }
  }

  return updated;
}
