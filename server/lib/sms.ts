/**
 * server/lib/sms.ts
 *
 * Reusable Twilio SMS utility for PaintersMax.
 *
 * Provides:
 *   sendSMS()                        — Low-level send wrapper using the official Twilio SDK
 *   sendNewLeadSMS()                 — Notifies business owner of a new lead via SMS
 *   sendAppointmentReminderSMS()     — Sends 24-hour reminder to customer before appointment
 *   sendInvoiceSentSMS()             — Sends invoice payment link to customer via SMS
 *   sendJobCompletionSMS()           — Thanks customer and requests Google review on job completion
 *
 * Configuration (environment variables):
 *   TWILIO_ACCOUNT_SID   — Required. Twilio Account SID (starts with AC...).
 *   TWILIO_AUTH_TOKEN    — Required. Twilio Auth Token.
 *   TWILIO_PHONE_NUMBER  — Required. Sender phone in E.164 format (e.g. +15551234567).
 *
 * If any credential is missing, functions log a warning and return gracefully — they never throw.
 */
import twilio from "twilio";

// ─── Configuration ────────────────────────────────────────────────────────────

function getTwilioClient(): ReturnType<typeof twilio> | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      "[SMS] Twilio credentials not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER."
    );
    return null;
  }
  return twilio(accountSid, authToken);
}

function getFromNumber(): string {
  return process.env.TWILIO_PHONE_NUMBER ?? "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendSMSOptions {
  to: string;
  body: string;
}

export interface SMSResult {
  sent: boolean;
  sid?: string;
  error?: string;
}

// ─── Core sendSMS() ───────────────────────────────────────────────────────────

/**
 * Sends an SMS via the official Twilio SDK.
 * Returns { sent: false } if any Twilio credential is missing — never throws.
 *
 * @param options.to    Recipient phone number in E.164 format (e.g. +15551234567)
 * @param options.body  The text message body to send
 */
export async function sendSMS(options: SendSMSOptions): Promise<SMSResult> {
  const client = getTwilioClient();
  if (!client) {
    return { sent: false, error: "Twilio credentials not configured" };
  }

  const fromNumber = getFromNumber();
  if (!fromNumber) {
    console.warn("[SMS] TWILIO_PHONE_NUMBER is not set — SMS not sent.");
    return { sent: false, error: "TWILIO_PHONE_NUMBER not configured" };
  }

  try {
    const message = await client.messages.create({
      from: fromNumber,
      to: options.to,
      body: options.body,
    });
    console.log(`[SMS] Sent to ${options.to} (sid: ${message.sid})`);
    return { sent: true, sid: message.sid };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[SMS] Twilio error:", errMsg);
    return { sent: false, error: errMsg };
  }
}

// ─── 1. New Lead SMS → Business Owner ────────────────────────────────────────

export interface NewLeadSMSInput {
  /** Business owner's phone number in E.164 format */
  ownerPhone: string;
  leadName: string;
  leadPhone?: string | null;
  leadSource?: string | null;
}

/**
 * Notifies the business owner via SMS when a new lead is created.
 * Message: "New lead: {name} | {phone} | {source}. Login to review."
 */
export async function sendNewLeadSMS(input: NewLeadSMSInput): Promise<SMSResult> {
  const phone = input.leadPhone ?? "no phone";
  const source = input.leadSource ?? "unknown source";
  const body = `New lead: ${input.leadName} | ${phone} | ${source}. Login to review.`;
  return sendSMS({ to: input.ownerPhone, body });
}

// ─── 2. Appointment Reminder SMS → Customer ──────────────────────────────────

export interface AppointmentReminderSMSInput {
  /** Customer's phone number in E.164 format */
  customerPhone: string;
  businessName?: string;
  appointmentTime: string;
}

/**
 * Sends a 24-hour appointment reminder to the customer.
 * Message: "{business name}: Reminder — your appointment is tomorrow at {time}. Reply STOP to opt out."
 */
export async function sendAppointmentReminderSMS(
  input: AppointmentReminderSMSInput
): Promise<SMSResult> {
  const businessName = input.businessName || "PaintersMax";
  const body = `${businessName}: Reminder — your appointment is tomorrow at ${input.appointmentTime}. Reply STOP to opt out.`;
  return sendSMS({ to: input.customerPhone, body });
}

// ─── 3. Invoice Sent SMS → Customer ──────────────────────────────────────────

export interface InvoiceSentSMSInput {
  /** Customer's phone number in E.164 format */
  customerPhone: string;
  businessName?: string;
  invoiceNumber: string;
  invoiceAmount: string;
  paymentLink?: string;
}

/**
 * Sends an invoice notification with payment link to the customer via SMS.
 * Message: "{business name}: Your invoice #{number} for ${amount} is ready. Pay here: {payment_link}"
 */
export async function sendInvoiceSentSMS(input: InvoiceSentSMSInput): Promise<SMSResult> {
  const businessName = input.businessName || "PaintersMax";
  const paymentPart = input.paymentLink ? ` Pay here: ${input.paymentLink}` : "";
  const body = `${businessName}: Your invoice #${input.invoiceNumber} for $${input.invoiceAmount} is ready.${paymentPart}`;
  return sendSMS({ to: input.customerPhone, body });
}

// ─── 4. Job Completion SMS → Customer ────────────────────────────────────────

export interface JobCompletionSMSInput {
  /** Customer's phone number in E.164 format */
  customerPhone: string;
  businessName?: string;
  googleReviewLink?: string;
}

/**
 * Sends a job completion thank-you SMS with an optional Google review link.
 * Message: "{business name}: Your job is complete! Thank you. We'd love a review: {google_review_link}"
 */
export async function sendJobCompletionSMS(input: JobCompletionSMSInput): Promise<SMSResult> {
  const businessName = input.businessName || "PaintersMax";
  const reviewPart = input.googleReviewLink
    ? ` We'd love a review: ${input.googleReviewLink}`
    : "";
  const body = `${businessName}: Your job is complete! Thank you.${reviewPart}`;
  return sendSMS({ to: input.customerPhone, body });
}
