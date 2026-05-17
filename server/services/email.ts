/**
 * server/services/email.ts
 *
 * Resend transactional email service for PaintersMax.
 *
 * Provides:
 *   sendNewLeadNotification()   — Notifies business owner when a new lead is created
 *   sendInvoiceEmail()          — Sends invoice with payment link to customer
 *   sendQuoteEmail()            — Sends quote/estimate to customer
 *
 * All functions:
 *   - Read RESEND_API_KEY from process.env
 *   - Use noreply@agentflowllc.com as the FROM address
 *   - Gracefully handle missing API key (log warning, return without crashing)
 */

import { ENV } from "../_core/env";

const FROM_ADDRESS = "PaintersMax <noreply@paintersmax.app>";

// ─── Lazy Resend client ───────────────────────────────────────────────────────

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Email] RESEND_API_KEY is not set — transactional emails will be skipped."
    );
    return null;
  }
  // Dynamic import to avoid crashing if resend is not installed
  const { Resend } = require("resend");
  return new Resend(apiKey);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

export interface NewLeadEmailInput {
  leadFirstName: string;
  leadLastName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadSource?: string | null;
  estimatedValue?: string | null;
  notes?: string | null;
  ownerEmail: string;
  businessName?: string;
}

export interface InvoiceEmailInput {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  invoiceTotal: string;
  dueDate?: string;
  paymentLink?: string;
  businessName?: string;
  lineItems?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
}

export interface QuoteEmailInput {
  customerName: string;
  customerEmail: string;
  quoteAmount: string;
  jobDescription?: string;
  businessName?: string;
  portalUrl?: string;
  notes?: string | null;
}

// ─── Email: New Lead Notification → Business Owner ────────────────────────────

/**
 * Sends a notification email to the business owner when a new lead is created.
 */
export async function sendNewLeadNotification(
  input: NewLeadEmailInput
): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };

  const businessName = input.businessName || "PaintersMax";
  const leadName = `${input.leadFirstName} ${input.leadLastName}`.trim();
  const estimatedValue = input.estimatedValue
    ? `$${parseFloat(input.estimatedValue).toFixed(2)}`
    : "Not specified";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #1a56db; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">🎯 New Lead Received</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">A new lead has been added to your CRM:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 40%;">Name</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 500;">${leadName}</td>
        </tr>
        ${input.leadEmail ? `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;"><a href="mailto:${input.leadEmail}" style="color: #1a56db;">${input.leadEmail}</a></td>
        </tr>` : ""}
        ${input.leadPhone ? `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Phone</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${input.leadPhone}</td>
        </tr>` : ""}
        ${input.leadSource ? `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Source</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${input.leadSource}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Estimated Value</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600;">${estimatedValue}</td>
        </tr>
        ${input.notes ? `<tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Notes</td>
          <td style="padding: 10px 0; color: #111827; font-size: 14px;">${input.notes}</td>
        </tr>` : ""}
      </table>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Log in to your CRM to follow up with this lead.</p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} via PaintersMax · <a href="mailto:noreply@paintersmax.app" style="color: #9ca3af;">noreply@paintersmax.app</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [input.ownerEmail],
      subject: `New Lead: ${leadName}${input.estimatedValue ? ` — ${estimatedValue}` : ""}`,
      html,
    });
    if (result.error) {
      console.error("[Email] sendNewLeadNotification error:", result.error);
      return { sent: false, error: String(result.error) };
    }
    console.log(`[Email] New lead notification sent to ${input.ownerEmail} (id: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] sendNewLeadNotification exception:", message);
    return { sent: false, error: message };
  }
}

// ─── Email: Invoice Sent → Customer ──────────────────────────────────────────

/**
 * Sends an invoice email with payment link to the customer.
 */
export async function sendInvoiceEmail(
  input: InvoiceEmailInput
): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };

  const businessName = input.businessName || "PaintersMax";

  const lineItemsHtml = input.lineItems && input.lineItems.length > 0
    ? `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Description</th>
          <th style="padding: 10px 12px; text-align: center; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #e5e7eb;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${input.lineItems.map(item => `
        <tr>
          <td style="padding: 10px 12px; color: #374151; font-size: 14px; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
          <td style="padding: 10px 12px; color: #374151; font-size: 14px; text-align: center; border-bottom: 1px solid #f3f4f6;">${item.quantity}</td>
          <td style="padding: 10px 12px; color: #374151; font-size: 14px; text-align: right; border-bottom: 1px solid #f3f4f6;">$${item.total.toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`
    : "";

  const payButtonHtml = input.paymentLink
    ? `<div style="text-align: center; margin: 28px 0;">
        <a href="${input.paymentLink}" style="display: inline-block; background: #1a56db; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">Pay Invoice Now</a>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${input.invoiceNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #1a56db; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Invoice ${input.invoiceNumber}</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi ${input.customerName},</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">Please find your invoice below. You can pay securely online using the button below.</p>
      ${lineItemsHtml}
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px 20px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #0369a1; font-size: 15px; font-weight: 600;">Total Due</span>
          <span style="color: #0369a1; font-size: 22px; font-weight: 700;">${input.invoiceTotal}</span>
        </div>
        ${input.dueDate ? `<p style="color: #0369a1; font-size: 13px; margin: 6px 0 0;">Due by ${input.dueDate}</p>` : ""}
      </div>
      ${payButtonHtml}
      ${input.paymentLink ? `<p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">Or copy this link: <a href="${input.paymentLink}" style="color: #1a56db;">${input.paymentLink}</a></p>` : ""}
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} · Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [input.customerEmail],
      subject: `Invoice ${input.invoiceNumber} from ${businessName} — ${input.invoiceTotal} due`,
      html,
    });
    if (result.error) {
      console.error("[Email] sendInvoiceEmail error:", result.error);
      return { sent: false, error: String(result.error) };
    }
    console.log(`[Email] Invoice email sent to ${input.customerEmail} (id: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] sendInvoiceEmail exception:", message);
    return { sent: false, error: message };
  }
}

// ─── Email: Quote/Estimate Sent → Customer ────────────────────────────────────

/**
 * Sends a quote/estimate email to the customer when a lead moves to the "quoted" stage.
 */
export async function sendQuoteEmail(
  input: QuoteEmailInput
): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };

  const businessName = input.businessName || "PaintersMax";

  const portalButtonHtml = input.portalUrl
    ? `<div style="text-align: center; margin: 28px 0;">
        <a href="${input.portalUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">View Your Quote</a>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from ${businessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #059669; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Your Quote is Ready</h1>
      <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi ${input.customerName},</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">Thank you for your interest! We've prepared a quote for your project.</p>
      ${input.jobDescription ? `<div style="background: #f9fafb; border-left: 4px solid #059669; padding: 12px 16px; margin: 0 0 20px; border-radius: 0 4px 4px 0;">
        <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Project:</strong> ${input.jobDescription}</p>
      </div>` : ""}
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px 20px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #065f46; font-size: 15px; font-weight: 600;">Estimated Total</span>
          <span style="color: #065f46; font-size: 22px; font-weight: 700;">${input.quoteAmount}</span>
        </div>
      </div>
      ${input.notes ? `<p style="color: #6b7280; font-size: 14px; margin: 16px 0;">${input.notes}</p>` : ""}
      ${portalButtonHtml}
      <p style="color: #374151; font-size: 14px; margin: 24px 0 0;">Please review your quote and let us know if you have any questions. We look forward to working with you!</p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} · Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [input.customerEmail],
      subject: `Your quote from ${businessName} — ${input.quoteAmount}`,
      html,
    });
    if (result.error) {
      console.error("[Email] sendQuoteEmail error:", result.error);
      return { sent: false, error: String(result.error) };
    }
    console.log(`[Email] Quote email sent to ${input.customerEmail} (id: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] sendQuoteEmail exception:", message);
    return { sent: false, error: message };
  }
}
