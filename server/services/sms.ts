/**
 * sms.ts — Twilio SMS service
 *
 * Provides sendSMS() for sending outbound SMS messages via the Twilio REST API.
 * Credentials are read exclusively from environment variables — never hardcoded.
 *
 * Required environment variables (set via webdev_request_secrets or .env):
 *   TWILIO_ACCOUNT_SID   — Twilio Account SID (starts with AC...)
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER  — Your Twilio phone number in E.164 format (+15551234567)
 */

import { ENV } from "../_core/env";
import { getDb } from "../db";
import { conversations } from "../../drizzle/schema";

export interface SendSMSResult {
  success: boolean;
  twilioSid?: string;
  status?: string;
  error?: string;
}

/**
 * Sends an outbound SMS via the Twilio REST API and records the message
 * in the conversations table.
 *
 * @param to        Recipient phone number in E.164 format (e.g. +15551234567)
 * @param message   The text body to send
 * @param leadId    The CRM lead ID this conversation belongs to
 * @param tenantId  Optional tenant identifier for multi-tenant deployments
 */
export async function sendSMS(
  to: string,
  message: string,
  leadId: number,
  tenantId?: number
): Promise<SendSMSResult> {
  const accountSid = ENV.twilioAccountSid;
  const authToken = ENV.twilioAuthToken;
  const fromNumber = ENV.twilioPhoneNumber;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[SMS] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
    // Still persist the message as a draft so the UI shows it
    await persistConversation({
      leadId,
      direction: "outbound",
      body: message,
      fromNumber: fromNumber || "unknown",
      toNumber: to,
      twilioSid: undefined,
      status: "not_configured",
      tenantId,
    });
    return { success: false, error: "Twilio credentials not configured" };
  }

  // Build the Twilio Messages API URL
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Encode the request body as application/x-www-form-urlencoded (Twilio requirement)
  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: message,
  });

  // Basic auth: accountSid:authToken encoded as Base64
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = (await response.json()) as {
      sid?: string;
      status?: string;
      error_code?: number;
      message?: string;
    };

    if (!response.ok) {
      const errMsg = data.message || `HTTP ${response.status}`;
      console.error("[SMS] Twilio API error:", errMsg);
      await persistConversation({
        leadId,
        direction: "outbound",
        body: message,
        fromNumber,
        toNumber: to,
        twilioSid: undefined,
        status: "failed",
        tenantId,
      });
      return { success: false, error: errMsg };
    }

    // Persist the sent message
    await persistConversation({
      leadId,
      direction: "outbound",
      body: message,
      fromNumber,
      toNumber: to,
      twilioSid: data.sid,
      status: data.status || "sent",
      tenantId,
    });

    return { success: true, twilioSid: data.sid, status: data.status };
  } catch (err) {
    const errMsg = (err as Error).message;
    console.error("[SMS] Network error sending SMS:", errMsg);
    await persistConversation({
      leadId,
      direction: "outbound",
      body: message,
      fromNumber,
      toNumber: to,
      twilioSid: undefined,
      status: "failed",
      tenantId,
    });
    return { success: false, error: errMsg };
  }
}

/**
 * Persists a conversation record (inbound or outbound) to the database.
 * Called internally by sendSMS() and the inbound webhook handler.
 */
export async function persistConversation(params: {
  leadId: number;
  direction: "inbound" | "outbound";
  body: string;
  fromNumber: string;
  toNumber: string;
  twilioSid?: string;
  status: string;
  tenantId?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[SMS] Database not available — conversation not persisted");
    return;
  }
  await db.insert(conversations).values({
    leadId: params.leadId,
    direction: params.direction,
    body: params.body,
    fromNumber: params.fromNumber,
    toNumber: params.toNumber,
    twilioSid: params.twilioSid ?? null,
    status: params.status,
    tenantId: params.tenantId ?? 1,
  });
}
