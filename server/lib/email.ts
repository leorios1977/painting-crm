/**
 * server/lib/email.ts
 *
 * Reusable Resend email utility for PaintPro CRM.
 *
 * Provides:
 *   sendEmail()                  — Low-level send wrapper with graceful error handling
 *   sendNewLeadEmail()           — Notifies business owner of a new lead
 *   sendInvoiceSentEmail()       — Sends invoice with payment link to customer
 *   sendQuoteEstimateEmail()     — Sends quote/estimate to customer
 *   sendJobCompletionEmail()     — Thanks customer and requests Google review on job completion
 *
 * Configuration:
 *   RESEND_API_KEY   — Required. Resend API key. If missing, emails are skipped (no crash).
 *   FROM_EMAIL       — Optional. Sender address. Defaults to noreply@painterspro.app
 */

import { Resend } from "resend";

// ─── Configuration ────────────────────────────────────────────────────────────

function getFromAddress(): string {
  return process.env.FROM_EMAIL ?? "noreply@painterspro.app";
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not set — transactional emails will be skipped.");
    return null;
  }
  return new Resend(apiKey);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

// ─── Core sendEmail() ─────────────────────────────────────────────────────────

/**
 * Sends a transactional email via Resend.
 * Returns { sent: false } if RESEND_API_KEY is missing — never throws.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };

  const fromAddress = options.from ?? `PaintPro CRM <${getFromAddress()}>`;
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    });

    if (result.error) {
      console.error("[Email] Send error:", result.error);
      return { sent: false, error: String(result.error) };
    }

    console.log(`[Email] Sent "${options.subject}" to ${toAddresses.join(", ")} (id: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Exception:", message);
    return { sent: false, error: message };
  }
}

// ─── 1. New Lead Notification → Business Owner ────────────────────────────────

export interface NewLeadEmailInput {
  ownerEmail: string;
  businessName?: string;
  leadFirstName: string;
  leadLastName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadSource?: string | null;
  estimatedValue?: string | null;
  notes?: string | null;
  dateReceived?: string;
}

export async function sendNewLeadEmail(input: NewLeadEmailInput): Promise<EmailResult> {
  const businessName = input.businessName || "PaintPro CRM";
  const leadName = `${input.leadFirstName} ${input.leadLastName}`.trim();
  const dateReceived = input.dateReceived ?? new Date().toLocaleDateString();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #1e40af; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">New Lead Received</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">A new lead has been submitted:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${leadName}</td></tr>
        ${input.leadEmail ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${input.leadEmail}</td></tr>` : ""}
        ${input.leadPhone ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${input.leadPhone}</td></tr>` : ""}
        ${input.leadSource ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Source</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${input.leadSource}</td></tr>` : ""}
        ${input.estimatedValue ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Est. Value</td><td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">${input.estimatedValue}</td></tr>` : ""}
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date Received</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">${dateReceived}</td></tr>
      </table>
      ${input.notes ? `<div style="background: #f9fafb; border-left: 4px solid #1e40af; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;"><p style="color: #374151; font-size: 14px; margin: 0;"><strong>Notes:</strong> ${input.notes}</p></div>` : ""}
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} CRM · Log in to manage this lead.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: input.ownerEmail,
    subject: `New Lead: ${leadName}`,
    html,
  });
}

// ─── 2. Invoice Sent → Customer ───────────────────────────────────────────────

export interface InvoiceSentEmailInput {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  invoiceTotal: string;
  dueDate?: string;
  paymentLink?: string;
  businessName?: string;
  lineItems?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
}

export async function sendInvoiceSentEmail(input: InvoiceSentEmailInput): Promise<EmailResult> {
  const businessName = input.businessName || "PaintPro CRM";

  const lineItemsHtml = input.lineItems?.length
    ? `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="text-align: left; padding: 8px 12px; font-size: 13px; color: #6b7280;">Description</th>
            <th style="text-align: right; padding: 8px 12px; font-size: 13px; color: #6b7280;">Qty</th>
            <th style="text-align: right; padding: 8px 12px; font-size: 13px; color: #6b7280;">Unit Price</th>
            <th style="text-align: right; padding: 8px 12px; font-size: 13px; color: #6b7280;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${input.lineItems.map(item => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; font-size: 14px; color: #374151;">${item.description}</td>
            <td style="text-align: right; padding: 8px 12px; font-size: 14px; color: #374151;">${item.quantity}</td>
            <td style="text-align: right; padding: 8px 12px; font-size: 14px; color: #374151;">$${item.unitPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 8px 12px; font-size: 14px; color: #374151;">$${item.total.toFixed(2)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #1e40af; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Invoice from ${businessName}</h1>
      <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">Invoice #${input.invoiceNumber}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi ${input.customerName},</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">Please find your invoice below. You can pay securely online using the button below.</p>
      ${lineItemsHtml}
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px 20px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #1e40af; font-size: 15px; font-weight: 600;">Amount Due</span>
          <span style="color: #1e40af; font-size: 22px; font-weight: 700;">${input.invoiceTotal}</span>
        </div>
        ${input.dueDate ? `<p style="color: #6b7280; font-size: 13px; margin: 8px 0 0;">Due by: ${input.dueDate}</p>` : ""}
      </div>
      ${input.paymentLink ? `<div style="text-align: center; margin: 28px 0;">
        <a href="${input.paymentLink}" style="display: inline-block; background: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">Pay Invoice Now</a>
      </div>
      <p style="text-align: center; color: #6b7280; font-size: 13px; margin: 0;">Or copy this link: <a href="${input.paymentLink}" style="color: #1e40af;">${input.paymentLink}</a></p>` : ""}
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} · Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: input.customerEmail,
    subject: `Your Invoice from ${businessName} - #${input.invoiceNumber}`,
    html,
  });
}

// ─── 3. Quote/Estimate Sent → Customer ───────────────────────────────────────

export interface QuoteEstimateEmailInput {
  customerName: string;
  customerEmail: string;
  quoteAmount: string;
  jobDescription?: string;
  businessName?: string;
  portalUrl?: string;
  validityDate?: string;
  notes?: string | null;
}

export async function sendQuoteEstimateEmail(input: QuoteEstimateEmailInput): Promise<EmailResult> {
  const businessName = input.businessName || "PaintPro CRM";

  const ctaButtonHtml = input.portalUrl
    ? `<div style="text-align: center; margin: 28px 0;">
        <a href="${input.portalUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">View Your Estimate</a>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #059669; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Your Estimate is Ready</h1>
      <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi ${input.customerName},</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">Thank you for your interest! We've prepared an estimate for your project.</p>
      ${input.jobDescription ? `<div style="background: #f9fafb; border-left: 4px solid #059669; padding: 12px 16px; margin: 0 0 20px; border-radius: 0 4px 4px 0;">
        <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Project:</strong> ${input.jobDescription}</p>
      </div>` : ""}
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px 20px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #065f46; font-size: 15px; font-weight: 600;">Estimated Total</span>
          <span style="color: #065f46; font-size: 22px; font-weight: 700;">${input.quoteAmount}</span>
        </div>
        ${input.validityDate ? `<p style="color: #6b7280; font-size: 13px; margin: 8px 0 0;">Valid until: ${input.validityDate}</p>` : ""}
      </div>
      ${input.notes ? `<p style="color: #6b7280; font-size: 14px; margin: 16px 0;">${input.notes}</p>` : ""}
      ${ctaButtonHtml}
      <p style="color: #374151; font-size: 14px; margin: 24px 0 0;">Please review your estimate and let us know if you have any questions. We look forward to working with you!</p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by ${businessName} · Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: input.customerEmail,
    subject: `Your Estimate from ${businessName}`,
    html,
  });
}

// ─── 4. Job Completion → Customer ─────────────────────────────────────────────

export interface JobCompletionEmailInput {
  customerName: string;
  customerEmail: string;
  businessName?: string;
  jobDescription?: string;
  completionDate?: string;
  googleReviewLink?: string;
}

export async function sendJobCompletionEmail(input: JobCompletionEmailInput): Promise<EmailResult> {
  const businessName = input.businessName || "PaintPro CRM";
  const completionDate = input.completionDate ?? new Date().toLocaleDateString();

  const reviewButtonHtml = input.googleReviewLink
    ? `<div style="text-align: center; margin: 28px 0;">
        <a href="${input.googleReviewLink}" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">⭐ Leave a Google Review</a>
      </div>
      <p style="text-align: center; color: #6b7280; font-size: 13px; margin: 0;">Your review helps us grow and helps other homeowners find trusted painters.</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #7c3aed; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Job Complete! 🎉</h1>
      <p style="color: #ddd6fe; margin: 4px 0 0; font-size: 14px;">${businessName}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi ${input.customerName},</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">We're thrilled to let you know that your job has been completed! Thank you for choosing ${businessName} — it was a pleasure working with you.</p>
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 16px 20px; margin: 16px 0;">
        ${input.jobDescription ? `<p style="color: #5b21b6; font-size: 14px; margin: 0 0 8px;"><strong>Project:</strong> ${input.jobDescription}</p>` : ""}
        <p style="color: #5b21b6; font-size: 14px; margin: 0;"><strong>Completed:</strong> ${completionDate}</p>
      </div>
      <p style="color: #374151; font-size: 15px; margin: 24px 0 16px;">If you're happy with the results, we'd love to hear from you! A quick Google review goes a long way in helping our small business grow.</p>
      ${reviewButtonHtml}
      <p style="color: #374151; font-size: 14px; margin: 24px 0 0;">If you have any concerns or questions about the work, please don't hesitate to reach out. We stand behind our work and want you to be completely satisfied.</p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Thank you from the team at ${businessName}.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: input.customerEmail,
    subject: `Job Complete — Thank you from ${businessName}!`,
    html,
  });
}
