/**
 * smsWebhook.ts — Inbound Twilio SMS webhook handler
 *
 * Twilio calls POST /webhook/sms when a customer replies to your Twilio number.
 * This handler:
 *   1. Validates the X-Twilio-Signature header (when TWILIO_AUTH_TOKEN is set)
 *   2. Looks up the lead by the customer's phone number
 *   3. Persists the inbound message to the conversations table
 *   4. Returns a TwiML 200 response so Twilio doesn't retry
 *
 * Register in Twilio Console → Phone Numbers → Messaging → Webhook URL:
 *   https://your-domain.manus.space/webhook/sms
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { conversations, leads } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

/**
 * Validates the Twilio request signature to prevent spoofed webhooks.
 * Returns true if the signature is valid or if no auth token is configured
 * (allowing development/testing without credentials).
 */
function validateTwilioSignature(req: Request): boolean {
  const authToken = ENV.twilioAuthToken;
  if (!authToken) {
    // No credentials configured — allow all requests (dev/test mode)
    console.warn("[SMS Webhook] TWILIO_AUTH_TOKEN not set — skipping signature validation");
    return true;
  }

  const twilioSignature = req.headers["x-twilio-signature"] as string | undefined;
  if (!twilioSignature) {
    console.warn("[SMS Webhook] Missing X-Twilio-Signature header");
    return false;
  }

  // Build the validation string: full URL + sorted POST params concatenated
  const appUrl = ENV.appUrl || `${req.protocol}://${req.get("host")}`;
  const fullUrl = `${appUrl}/webhook/sms`;

  const params = req.body as Record<string, string>;
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}${params[k]}`).join("");

  const expectedSignature = crypto
    .createHmac("sha1", authToken)
    .update(fullUrl + paramString)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(twilioSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Registers the POST /webhook/sms route on the Express app.
 * Call this from server/_core/index.ts before the tRPC middleware.
 */
export function registerSmsWebhook(app: Express): void {
  app.post("/webhook/sms", async (req: Request, res: Response) => {
    // Always respond with TwiML so Twilio doesn't retry on errors
    const twimlOk = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    const twimlErr = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Webhook error — please try again.</Message></Response>`;

    try {
      // Validate signature
      if (!validateTwilioSignature(req)) {
        console.error("[SMS Webhook] Invalid Twilio signature — rejecting request");
        res.status(403).type("text/xml").send(twimlErr);
        return;
      }

      const body = req.body as Record<string, string>;
      const messageSid = body.MessageSid ?? "";
      const from = body.From ?? "";
      const to = body.To ?? "";
      const messageBody = body.Body ?? "";

      if (!from || !messageBody) {
        res.status(400).type("text/xml").send(twimlErr);
        return;
      }

      const db = await getDb();
      if (!db) {
        console.error("[SMS Webhook] Database not available");
        res.status(200).type("text/xml").send(twimlOk);
        return;
      }

      // Normalize phone number: strip spaces/dashes for matching
      const normalizedFrom = from.replace(/[\s\-().]/g, "");

      // Find the lead by phone number (try exact match and normalized match)
      const allLeads = await db
        .select({ id: leads.id, phone: leads.phone })
        .from(leads)
        .where(or(eq(leads.phone, from), eq(leads.phone, normalizedFrom)));

      // Use the first matching lead, or fall back to leadId 0 (unmatched)
      const leadId = allLeads.length > 0 ? allLeads[0].id : 0;

      if (leadId === 0) {
        console.warn(`[SMS Webhook] No lead found for phone number: ${from}`);
      }

      // Persist the inbound message
      await db.insert(conversations).values({
        leadId,
        direction: "inbound",
        body: messageBody,
        fromNumber: from,
        toNumber: to,
        twilioSid: messageSid || null,
        status: "received",
        tenantId: null,
      });

      console.log(`[SMS Webhook] Inbound SMS from ${from} → lead ${leadId}: "${messageBody.slice(0, 60)}"`);

      res.status(200).type("text/xml").send(twimlOk);
    } catch (err) {
      console.error("[SMS Webhook] Unhandled error:", (err as Error).message);
      res.status(200).type("text/xml").send(twimlOk); // Always 200 to prevent Twilio retries
    }
  });
}
