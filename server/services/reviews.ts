/**
 * reviews.ts — Google Review request service
 *
 * Provides:
 *   sendReviewRequest(leadId)  — Sends an SMS to the customer asking for a Google Review.
 *                                Uses the google_review_link stored in app_settings.
 *                                Logs the action to communication_log.
 *
 * The auto-trigger (when a lead moves to 'completed') is handled in the leads router
 * via a setTimeout-based 2-hour delay that calls this function.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { leads, appSettings, communicationLog } from "../../drizzle/schema";
import { sendSMS } from "./sms";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewRequestResult {
  success: boolean;
  smsSent: boolean;
  message: string;
  error?: string;
  /** true when Twilio is not configured — SMS was simulated */
  mock?: boolean;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Sends a Google Review request SMS to the customer associated with the given lead.
 *
 * Steps:
 *  1. Fetch the lead to get the customer's first name and phone number.
 *  2. Fetch app_settings to get the google_review_link.
 *  3. Compose and send the SMS via the existing sms.ts service.
 *  4. Log the action to communication_log.
 *
 * Returns a result object describing what happened (success, mock, error).
 */
export async function sendReviewRequest(
  leadId: number,
  triggeredBy?: number
): Promise<ReviewRequestResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      smsSent: false,
      message: "Database not available",
      error: "Database not available",
    };
  }

  // ── 1. Fetch lead ──────────────────────────────────────────────────────────
  const leadRows = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      phone: leads.phone,
      stage: leads.stage,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  const lead = leadRows[0];
  if (!lead) {
    return {
      success: false,
      smsSent: false,
      message: `Lead ${leadId} not found`,
      error: `Lead ${leadId} not found`,
    };
  }

  if (!lead.phone) {
    return {
      success: false,
      smsSent: false,
      message: `Lead ${leadId} has no phone number — review request not sent`,
      error: "No phone number on file",
    };
  }

  // ── 2. Fetch app settings ──────────────────────────────────────────────────
  const settingsRows = await db
    .select({
      googleReviewLink: appSettings.googleReviewLink,
    })
    .from(appSettings)
    .limit(1);

  const reviewLink = settingsRows[0]?.googleReviewLink;

  if (!reviewLink) {
    return {
      success: false,
      smsSent: false,
      message: "Google Review link not configured in Settings",
      error: "Google Review link not configured — add it in Settings → Google Review Link",
    };
  }

  // ── 3. Compose and send SMS ────────────────────────────────────────────────
  const smsBody =
    `Hi ${lead.firstName}, thank you for choosing us! ` +
    `We would love your feedback — please leave us a quick Google Review here: ${reviewLink}`;

  const smsResult = await sendSMS(smsBody, lead.phone, leadId);

  // ── 4. Log to communication_log ────────────────────────────────────────────
  try {
    await db.insert(communicationLog).values({
      leadId,
      type: "sms",
      direction: "outbound",
      subject: "Google Review Request",
      content: smsBody,
      sentBy: triggeredBy ?? null,
    });
  } catch (logErr) {
    console.warn("[Reviews] Failed to log review request:", (logErr as Error).message);
  }

  if (smsResult.success) {
    return {
      success: true,
      smsSent: true,
      message: `Review request SMS sent to ${lead.firstName} ${lead.lastName}`,
    };
  } else {
    return {
      success: false,
      smsSent: false,
      message: `Failed to send review request SMS: ${smsResult.error ?? "unknown error"}`,
      error: smsResult.error,
    };
  }
}

/**
 * Schedules a review request to fire after a delay (default: 2 hours).
 * Uses a non-blocking setTimeout — safe for in-process scheduling.
 * For production, replace with a proper job queue (BullMQ, etc.).
 */
export function scheduleReviewRequest(
  leadId: number,
  delayMs: number = 2 * 60 * 60 * 1000, // 2 hours
  triggeredBy?: number
): void {
  console.log(
    `[Reviews] Scheduling review request for lead ${leadId} in ${delayMs / 1000 / 60} minutes`
  );
  setTimeout(async () => {
    try {
      const result = await sendReviewRequest(leadId, triggeredBy);
      console.log(`[Reviews] Auto review request for lead ${leadId}:`, result.message);
    } catch (err) {
      console.error(`[Reviews] Auto review request failed for lead ${leadId}:`, err);
    }
  }, delayMs);
}
