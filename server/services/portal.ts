/**
 * portal.ts — Customer-facing portal service
 *
 * Provides:
 *   generatePortalToken(leadId)  — creates/returns a unique secure URL token for a lead
 *   getPortalData(token)         — returns all public-safe data for a portal page
 *   addPortalPhoto(leadId, ...)  — appends a before/after/progress photo to the lead
 *   removePortalPhoto(leadId, url) — removes a photo by URL
 */

import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { leads, invoices, appointments } from "../../drizzle/schema";
import { ENV } from "../_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortalPhoto = {
  url: string;
  caption: string;
  type: "before" | "after" | "progress";
};

export type PortalData = {
  lead: {
    firstName: string;
    lastName: string;
    projectType: string | null;
    projectAddress: string | null;
    projectDescription: string | null;
    stage: string;
    scheduledDate: Date | null;
    completedDate: Date | null;
    portalPhotos: PortalPhoto[];
  };
  invoice: {
    invoiceNumber: string;
    lineItems: unknown;
    subtotal: string;
    tax: string;
    total: string;
    status: string;
    dueDate: Date | null;
    paidAt: Date | null;
    stripePaymentLink: string | null;
  } | null;
  appointment: {
    scheduledDate: Date;
    timeSlot: string | null;
    jobType: string | null;
    crewAssigned: string | null;
    status: string;
    notes: string | null;
  } | null;
};

// ─── Generate / retrieve portal token ────────────────────────────────────────

/**
 * Returns the existing portal token for a lead, or generates and persists a new one.
 * The token is a 32-character URL-safe nanoid.
 */
export async function generatePortalToken(leadId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if token already exists
  const rows = await db
    .select({ id: leads.id, portalToken: leads.portalToken })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  const lead = rows[0];
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  if (lead.portalToken) return lead.portalToken;

  // Generate a new unique token
  const token = nanoid(32);
  await db
    .update(leads)
    .set({ portalToken: token })
    .where(eq(leads.id, leadId));

  return token;
}

/**
 * Builds the full portal URL for a given lead.
 * Uses APP_URL env var if set, otherwise falls back to a relative path hint.
 */
export function buildPortalUrl(token: string, origin?: string): string {
  const base = origin ?? ENV.appUrl ?? "";
  return `${base}/portal/${token}`;
}

// ─── Fetch portal data (public-safe) ─────────────────────────────────────────

/**
 * Returns all data needed to render the customer portal page.
 * Only exposes fields that are safe to show to the customer.
 * Returns null if the token is invalid.
 */
export async function getPortalData(token: string): Promise<PortalData | null> {
  const db = await getDb();
  if (!db) return null;

  // Find lead by token
  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.portalToken, token))
    .limit(1);

  const lead = leadRows[0];
  if (!lead) return null;

  // Get the most recent non-draft invoice for this lead
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.leadId, lead.id))
    .orderBy(desc(invoices.createdAt))
    .limit(10);

  // Prefer sent/paid invoice; fall back to most recent
  const activeInvoice =
    invoiceRows.find((i) => i.status === "sent" || i.status === "paid") ??
    invoiceRows.find((i) => i.status !== "draft") ??
    null;

  // Get the most recent upcoming or confirmed appointment
  const apptRows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.leadId, lead.id))
    .orderBy(desc(appointments.scheduledDate))
    .limit(5);

  const activeAppt =
    apptRows.find((a) => a.status === "confirmed" || a.status === "scheduled") ??
    apptRows[0] ??
    null;

  return {
    lead: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      projectType: lead.projectType,
      projectAddress: lead.projectAddress,
      projectDescription: lead.projectDescription,
      stage: lead.stage,
      scheduledDate: lead.scheduledDate,
      completedDate: lead.completedDate,
      portalPhotos: (lead.portalPhotos as PortalPhoto[]) ?? [],
    },
    invoice: activeInvoice
      ? {
          invoiceNumber: activeInvoice.invoiceNumber,
          lineItems: activeInvoice.lineItems,
          subtotal: String(activeInvoice.subtotal),
          tax: String(activeInvoice.tax),
          total: String(activeInvoice.total),
          status: activeInvoice.status,
          dueDate: activeInvoice.dueDate,
          paidAt: activeInvoice.paidAt,
          stripePaymentLink: activeInvoice.stripePaymentLink,
        }
      : null,
    appointment: activeAppt
      ? {
          scheduledDate: activeAppt.scheduledDate,
          timeSlot: activeAppt.timeSlot,
          jobType: activeAppt.jobType,
          crewAssigned: activeAppt.crewAssigned,
          status: activeAppt.status,
          notes: activeAppt.notes,
        }
      : null,
  };
}

// ─── Photo management ─────────────────────────────────────────────────────────

export async function addPortalPhoto(
  leadId: number,
  photo: PortalPhoto
): Promise<PortalPhoto[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({ portalPhotos: leads.portalPhotos })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  const existing = (rows[0]?.portalPhotos as PortalPhoto[]) ?? [];
  const updated = [...existing, photo];

  await db.update(leads).set({ portalPhotos: updated }).where(eq(leads.id, leadId));
  return updated;
}

export async function removePortalPhoto(
  leadId: number,
  photoUrl: string
): Promise<PortalPhoto[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({ portalPhotos: leads.portalPhotos })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  const existing = (rows[0]?.portalPhotos as PortalPhoto[]) ?? [];
  const updated = existing.filter((p) => p.url !== photoUrl);

  await db.update(leads).set({ portalPhotos: updated }).where(eq(leads.id, leadId));
  return updated;
}
