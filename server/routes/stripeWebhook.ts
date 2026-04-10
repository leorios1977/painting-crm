/**
 * stripeWebhook.ts — Stripe payment webhook handler
 *
 * Listens for POST /api/webhooks/stripe and handles:
 *   - checkout.session.completed
 *   - payment_intent.succeeded
 *
 * For each event, the handler:
 *   1. Verifies the Stripe-Signature header using STRIPE_WEBHOOK_SECRET
 *   2. Extracts the payment link ID or session ID from the event payload
 *   3. Finds the matching invoice in the database
 *   4. Marks the invoice as paid (status → 'paid', paidAt → now)
 *   5. Updates the associated lead's pipeline stage to 'paid'
 *
 * Register in Stripe Dashboard → Developers → Webhooks:
 *   Endpoint URL: https://paintcrm-h9zwcmfu.manus.space/api/webhooks/stripe
 *   Events: checkout.session.completed, payment_intent.succeeded
 *
 * Register in server/_core/index.ts BEFORE express.json() middleware so that
 * the raw body is preserved for signature verification.
 */
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { invoices, leads, communicationLog } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

// ─── Types for Stripe event payloads ─────────────────────────────────────────

interface StripeCheckoutSession {
  id: string;
  object: "checkout.session";
  payment_link?: string | null;
  payment_intent?: string | null;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  metadata?: Record<string, string>;
}

interface StripePaymentIntent {
  id: string;
  object: "payment_intent";
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface StripeEvent {
  id: string;
  object: "event";
  type: string;
  data: {
    object: StripeCheckoutSession | StripePaymentIntent | Record<string, unknown>;
  };
}

// ─── Signature verification ───────────────────────────────────────────────────

/**
 * Verifies the Stripe-Signature header using the webhook signing secret.
 *
 * Stripe signs each webhook payload with a HMAC-SHA256 signature.
 * The header format is: t=<timestamp>,v1=<signature>[,v0=<old_signature>]
 *
 * Returns true if:
 *   - No STRIPE_WEBHOOK_SECRET is configured (dev/test mode — logs a warning)
 *   - The computed signature matches the v1 signature in the header
 *
 * Returns false if the signature is invalid or the timestamp is stale (>5 min).
 */
function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): { valid: boolean; reason?: string } {
  if (!secret) {
    console.warn(
      "[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev mode)"
    );
    return { valid: true };
  }

  if (!signatureHeader) {
    return { valid: false, reason: "Missing Stripe-Signature header" };
  }

  // Parse header: t=<timestamp>,v1=<sig1>[,v1=<sig2>]
  const parts: Record<string, string[]> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key && value) {
      if (!parts[key]) parts[key] = [];
      parts[key].push(value);
    }
  }

  const timestamp = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];

  if (!timestamp || signatures.length === 0) {
    return { valid: false, reason: "Malformed Stripe-Signature header" };
  }

  // Reject stale webhooks (>5 minutes old) to prevent replay attacks
  const timestampMs = parseInt(timestamp, 10) * 1000;
  const ageMs = Date.now() - timestampMs;
  if (ageMs > 5 * 60 * 1000) {
    return { valid: false, reason: `Webhook timestamp too old (${Math.round(ageMs / 1000)}s)` };
  }

  // Compute expected signature: HMAC-SHA256(timestamp + "." + rawBody, secret)
  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Compare against all v1 signatures (Stripe can send multiple during key rotation)
  const isValid = signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
    } catch {
      return false;
    }
  });

  if (!isValid) {
    return { valid: false, reason: "Signature mismatch" };
  }

  return { valid: true };
}

// ─── Invoice lookup helpers ───────────────────────────────────────────────────

/**
 * Finds an invoice by Stripe payment link ID or session ID.
 * Returns the first matching unpaid invoice, or undefined if not found.
 */
async function findInvoiceByStripeIds(
  paymentLinkId: string | null | undefined,
  sessionId: string | null | undefined
) {
  const db = await getDb();
  if (!db) return undefined;

  // Try by payment link ID first (most reliable — set when invoice is created)
  if (paymentLinkId) {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripePaymentLinkId, paymentLinkId))
      .limit(1);
    if (rows[0]) return rows[0];
  }

  // Fall back to session ID (set when customer opens the checkout)
  if (sessionId) {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeSessionId, sessionId))
      .limit(1);
    if (rows[0]) return rows[0];
  }

  return undefined;
}

/**
 * Marks an invoice as paid and updates the lead's pipeline stage to 'paid'.
 * Logs the payment event to the communication log.
 */
async function markPaidAndUpdateLead(
  invoiceId: number,
  leadId: number,
  sessionId: string | null | undefined,
  eventType: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paidAt = new Date();

  // Update invoice status
  await db
    .update(invoices)
    .set({ status: "paid", paidAt, stripeSessionId: sessionId ?? null })
    .where(eq(invoices.id, invoiceId));

  // Update lead pipeline stage to 'paid'
  await db
    .update(leads)
    .set({ stage: "paid", paidAt })
    .where(eq(leads.id, leadId));

  // Log the payment event
  try {
    const inv = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    const invoice = inv[0];
    await db.insert(communicationLog).values({
      leadId,
      type: "system",
      direction: "internal",
      subject: `Payment received via Stripe (${eventType})`,
      content:
        `Invoice ${invoice?.invoiceNumber ?? `#${invoiceId}`} marked as paid` +
        (invoice?.total ? ` ($${invoice.total})` : "") +
        `. Stripe event: ${eventType}.` +
        (sessionId ? ` Session: ${sessionId}.` : ""),
      sentBy: null,
    });
  } catch (logErr) {
    console.warn("[Stripe Webhook] Failed to write communication log:", (logErr as Error).message);
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: StripeCheckoutSession
): Promise<{ processed: boolean; reason?: string }> {
  if (session.payment_status !== "paid") {
    return { processed: false, reason: `payment_status is '${session.payment_status}', not 'paid'` };
  }

  const invoice = await findInvoiceByStripeIds(session.payment_link, session.id);
  if (!invoice) {
    return {
      processed: false,
      reason: `No invoice found for payment_link=${session.payment_link ?? "null"} session=${session.id}`,
    };
  }

  if (invoice.status === "paid") {
    return { processed: true, reason: "Already paid — skipping" };
  }

  await markPaidAndUpdateLead(invoice.id, invoice.leadId, session.id, "checkout.session.completed");
  console.log(
    `[Stripe Webhook] Invoice ${invoice.invoiceNumber} (id=${invoice.id}) marked paid via checkout.session.completed`
  );
  return { processed: true };
}

async function handlePaymentIntentSucceeded(
  paymentIntent: StripePaymentIntent
): Promise<{ processed: boolean; reason?: string }> {
  // payment_intent.succeeded doesn't carry a payment_link directly.
  // Try to find the invoice by the payment intent ID stored in stripeSessionId,
  // or via metadata if the invoice ID was embedded.
  const metaInvoiceId = paymentIntent.metadata?.invoice_id
    ? parseInt(paymentIntent.metadata.invoice_id, 10)
    : undefined;

  let invoice;

  if (metaInvoiceId && !isNaN(metaInvoiceId)) {
    const db = await getDb();
    if (db) {
      const rows = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, metaInvoiceId))
        .limit(1);
      invoice = rows[0];
    }
  }

  // Fall back: look up by stripeSessionId matching the payment intent ID
  if (!invoice) {
    invoice = await findInvoiceByStripeIds(null, paymentIntent.id);
  }

  if (!invoice) {
    return {
      processed: false,
      reason: `No invoice found for payment_intent=${paymentIntent.id}`,
    };
  }

  if (invoice.status === "paid") {
    return { processed: true, reason: "Already paid — skipping" };
  }

  await markPaidAndUpdateLead(invoice.id, invoice.leadId, paymentIntent.id, "payment_intent.succeeded");
  console.log(
    `[Stripe Webhook] Invoice ${invoice.invoiceNumber} (id=${invoice.id}) marked paid via payment_intent.succeeded`
  );
  return { processed: true };
}

// ─── Express route registration ───────────────────────────────────────────────

/**
 * Registers the POST /api/webhooks/stripe route on the Express app.
 *
 * IMPORTANT: This must be registered BEFORE express.json() middleware so that
 * the raw request body is available for Stripe signature verification.
 * Call this from server/_core/index.ts.
 */
export function registerStripeWebhook(app: Express): void {
  // Use express.raw() to capture the raw body — required for Stripe signature verification.
  // This only applies to this specific route, not the rest of the app.
  app.post(
    "/api/webhooks/stripe",
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    (req: Request, res: Response, next) => {
      // Capture raw body as Buffer before any JSON parsing
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        (req as Request & { rawBody: Buffer }).rawBody = Buffer.concat(chunks);
        next();
      });
      req.on("error", (err) => {
        console.error("[Stripe Webhook] Request stream error:", err.message);
        res.status(400).json({ error: "Request stream error" });
      });
    },
    async (req: Request, res: Response) => {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

      if (!rawBody) {
        res.status(400).json({ error: "No request body received" });
        return;
      }

      // ── Signature verification ────────────────────────────────────────────
      const signatureHeader = req.headers["stripe-signature"] as string | undefined;
      const webhookSecret = ENV.stripeWebhookSecret;

      const { valid, reason } = verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
      if (!valid) {
        console.error(`[Stripe Webhook] Signature verification failed: ${reason}`);
        res.status(400).json({ error: `Webhook signature invalid: ${reason}` });
        return;
      }

      // ── Parse event ───────────────────────────────────────────────────────
      let event: StripeEvent;
      try {
        event = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
      } catch (parseErr) {
        console.error("[Stripe Webhook] Failed to parse JSON body:", (parseErr as Error).message);
        res.status(400).json({ error: "Invalid JSON body" });
        return;
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (id=${event.id})`);

      // ── Route by event type ───────────────────────────────────────────────
      try {
        let result: { processed: boolean; reason?: string } = {
          processed: false,
          reason: "Unhandled event type",
        };

        if (event.type === "checkout.session.completed") {
          result = await handleCheckoutSessionCompleted(
            event.data.object as StripeCheckoutSession
          );
        } else if (event.type === "payment_intent.succeeded") {
          result = await handlePaymentIntentSucceeded(
            event.data.object as StripePaymentIntent
          );
        } else {
          // Acknowledge other event types without processing them
          console.log(`[Stripe Webhook] Ignoring unhandled event type: ${event.type}`);
          res.status(200).json({ received: true, processed: false, reason: "Unhandled event type" });
          return;
        }

        if (result.processed) {
          res.status(200).json({ received: true, processed: true });
        } else {
          // Still return 200 so Stripe doesn't retry — just log the skip reason
          console.log(`[Stripe Webhook] Event not processed: ${result.reason}`);
          res.status(200).json({ received: true, processed: false, reason: result.reason });
        }
      } catch (handlerErr) {
        console.error("[Stripe Webhook] Handler error:", (handlerErr as Error).message);
        // Return 500 so Stripe retries the event
        res.status(500).json({ error: "Internal server error processing webhook" });
      }
    }
  );
}
