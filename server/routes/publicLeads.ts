/**
 * publicLeads.ts — Public (unauthenticated) lead intake endpoint
 *
 * Registers:
 *   POST /api/public/leads
 *
 * Accepts JSON:
 *   { name, email, phone, message, source, serviceType }
 *
 * Required fields: name, phone
 *
 * On success:
 *   - Creates a new lead in the database with stage 'lead'
 *   - Sends new-lead notification email to business owner (non-fatal)
 *   - Sends new-lead notification SMS to business owner (non-fatal)
 *   - Returns 201 { success: true, message: 'Lead received' }
 *
 * On validation error:
 *   - Returns 400 { success: false, error: '...' }
 *
 * On server error:
 *   - Returns 500 { success: false, error: 'Internal server error' }
 */
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { leads, appSettings } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { sendNewLeadEmail } from "../lib/email";
import { sendNewLeadSMS } from "../lib/sms";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicLeadBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  source?: unknown;
  serviceType?: unknown;
}

// ─── Helper: split a full name into first/last ────────────────────────────────

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerPublicLeadsRoute(app: Express): void {
  app.post("/api/public/leads", async (req: Request, res: Response) => {
    try {
      const body = req.body as PublicLeadBody;

      // ── Validation ──────────────────────────────────────────────────────────
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";

      if (!name) {
        return res.status(400).json({ success: false, error: "name is required" });
      }
      if (!phone) {
        return res.status(400).json({ success: false, error: "phone is required" });
      }

      const email =
        typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : null;
      const source =
        typeof body.source === "string" && body.source.trim()
          ? body.source.trim()
          : "website";
      const serviceType =
        typeof body.serviceType === "string" && body.serviceType.trim()
          ? body.serviceType.trim()
          : null;

      const { firstName, lastName } = splitName(name);

      // ── Insert lead ─────────────────────────────────────────────────────────
      const db = await getDb();
      if (!db) {
        console.error("[PublicLeads] Database not available");
        return res.status(500).json({ success: false, error: "Internal server error" });
      }

      const insertResult = await db
        .insert(leads)
        .values({
          tenantId: 1,
          firstName,
          lastName,
          email: email ?? undefined,
          phone,
          projectType: serviceType ?? undefined,
          projectDescription: message ?? undefined,
          source,
          stage: "lead",
          lastContactedAt: new Date(),
        })
        .returning({ id: leads.id });

      const newLeadId = insertResult[0]?.id ?? 0;
      console.log(`[PublicLeads] New lead created: id=${newLeadId} name="${name}" source="${source}"`);

      // ── Fetch business settings for notifications ────────────────────────────
      let businessName = "PaintersMax";
      try {
        const settingsRows = await db
          .select({ businessName: appSettings.businessName })
          .from(appSettings)
          .limit(1);
        businessName = settingsRows[0]?.businessName || businessName;
      } catch { /* non-fatal */ }

      // ── Email notification → business owner ─────────────────────────────────
      try {
        const ownerEmail = ENV.ownerEmail;
        if (ownerEmail) {
          await sendNewLeadEmail({
            ownerEmail,
            businessName,
            leadFirstName: firstName,
            leadLastName: lastName,
            leadEmail: email,
            leadPhone: phone,
            leadSource: source,
            notes: message,
            dateReceived: new Date().toLocaleDateString(),
          });
        }
      } catch (emailErr) {
        console.warn(
          "[PublicLeads] Failed to send new lead email:",
          (emailErr as Error).message
        );
      }

      // ── SMS notification → business owner ───────────────────────────────────
      try {
        const ownerPhone = process.env.OWNER_PHONE;
        if (ownerPhone) {
          await sendNewLeadSMS({
            ownerPhone,
            leadName: `${firstName} ${lastName}`.trim(),
            leadPhone: phone,
            leadSource: source,
          });
        }
      } catch (smsErr) {
        console.warn(
          "[PublicLeads] Failed to send new lead SMS:",
          (smsErr as Error).message
        );
      }

      // ── Success response ─────────────────────────────────────────────────────
      return res.status(201).json({ success: true, message: "Lead received" });
    } catch (err) {
      console.error("[PublicLeads] Unhandled error:", (err as Error).message);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
}
