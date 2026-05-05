/**
 * schedule.ts — Appointment scheduling service
 *
 * Provides functions to create, update, and cancel appointments linked to leads.
 * After creating an appointment, automatically triggers:
 *   1. A confirmation SMS via the existing sms.ts service
 *   2. A confirmation email via the Manus built-in email API (or logs if not configured)
 *
 * This service is intentionally side-effect free for updates/cancellations —
 * callers decide whether to send follow-up communications.
 */

import { getDb } from "../db";
import { appointments, leads, communicationLog, crewMembers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "./sms";
import { sendAppointmentReminderSMS } from "../lib/sms";
import type { Appointment, InsertAppointment } from "../../drizzle/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAppointmentInput {
  leadId: number;
  tenantId?: number;
  crewAssigned?: string;
  jobType?: string;
  scheduledDate: Date;
  timeSlot?: string;
  notes?: string;
  createdBy?: number;
  /** Whether to send confirmation SMS to the customer */
  sendConfirmationSms?: boolean;
  /** Whether to send confirmation email to the customer */
  sendConfirmationEmail?: boolean;
}

export interface UpdateAppointmentInput {
  id: number;
  crewAssigned?: string;
  jobType?: string;
  scheduledDate?: Date;
  timeSlot?: string;
  status?: Appointment["status"];
  notes?: string;
}

export interface AppointmentResult {
  appointment: Appointment;
  smsSent: boolean;
  emailSent: boolean;
  smsError?: string;
  emailError?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a Date for display in messages, e.g. "Monday, April 14 at 8:00 AM" */
function formatAppointmentDate(date: Date, timeSlot?: string | null): string {
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return timeSlot ? `${datePart} at ${timeSlot}` : datePart;
}

/** Builds the SMS confirmation message body */
function buildSmsConfirmation(params: {
  firstName: string;
  jobType?: string | null;
  scheduledDate: Date;
  timeSlot?: string | null;
  companyName?: string;
}): string {
  const company = params.companyName || "PaintPro";
  const job = params.jobType || "your painting job";
  const when = formatAppointmentDate(params.scheduledDate, params.timeSlot);
  return `Hi ${params.firstName}! This is ${company} confirming your appointment for ${job} on ${when}. Reply STOP to opt out.`;
}

/** Builds the email confirmation body (plain text fallback) */
function buildEmailConfirmation(params: {
  firstName: string;
  lastName: string;
  jobType?: string | null;
  scheduledDate: Date;
  timeSlot?: string | null;
  crewAssigned?: string | null;
  companyName?: string;
}): { subject: string; body: string } {
  const company = params.companyName || "PaintPro";
  const job = params.jobType || "Painting Job";
  const when = formatAppointmentDate(params.scheduledDate, params.timeSlot);
  const crew = params.crewAssigned ? `\nCrew: ${params.crewAssigned}` : "";

  return {
    subject: `Appointment Confirmed — ${job} on ${when}`,
    body: `Hi ${params.firstName},\n\nYour appointment has been confirmed!\n\nJob: ${job}\nDate: ${when}${crew}\n\nIf you need to reschedule, please contact us as soon as possible.\n\nThank you for choosing ${company}!\n\nBest regards,\n${company} Team`,
  };
}

// ─── Core service functions ───────────────────────────────────────────────────

/**
 * Creates a new appointment and optionally sends confirmation SMS and email.
 * Returns the created appointment record plus send status for both channels.
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<AppointmentResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch the lead to get customer contact info
  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);

  const lead = leadRows[0];
  if (!lead) throw new Error(`Lead ${input.leadId} not found`);

  // Insert the appointment
  await db.insert(appointments).values({
    leadId: input.leadId,
    crewAssigned: input.crewAssigned ?? null,
    jobType: input.jobType ?? lead.projectType ?? null,
    scheduledDate: input.scheduledDate,
    timeSlot: input.timeSlot ?? null,
    status: "scheduled",
    notes: input.notes ?? null,
    smsSent: false,
    emailSent: false,
    createdBy: input.createdBy ?? null,
  } satisfies InsertAppointment);

  // Fetch the newly created appointment (get the latest for this lead)
  const apptRows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.leadId, input.leadId))
    .orderBy(appointments.createdAt)
    .limit(100);

  const appointment = apptRows[apptRows.length - 1];
  if (!appointment) throw new Error("Failed to retrieve created appointment");

  let smsSent = false;
  let emailSent = false;
  let smsError: string | undefined;
  let emailError: string | undefined;

  // ── Send confirmation SMS ──────────────────────────────────────────────────
  if (input.sendConfirmationSms !== false && lead.phone) {
    try {
      const smsBody = buildSmsConfirmation({
        firstName: lead.firstName,
        jobType: input.jobType ?? lead.projectType,
        scheduledDate: input.scheduledDate,
        timeSlot: input.timeSlot,
      });

      const smsResult = await sendSMS(smsBody, lead.phone, input.leadId);
      smsSent = smsResult.success;
      if (!smsResult.success) smsError = smsResult.error;
    } catch (err) {
      smsError = (err as Error).message;
      console.error("[Schedule] SMS confirmation failed:", smsError);
    }
  }

  // ── Send confirmation email ────────────────────────────────────────────────
  if (input.sendConfirmationEmail !== false && lead.email) {
    try {
      const { subject, body } = buildEmailConfirmation({
        firstName: lead.firstName,
        lastName: lead.lastName,
        jobType: input.jobType ?? lead.projectType,
        scheduledDate: input.scheduledDate,
        timeSlot: input.timeSlot,
        crewAssigned: input.crewAssigned,
      });

      await sendConfirmationEmail({
        to: lead.email,
        subject,
        body,
        leadId: input.leadId,
      });

      emailSent = true;
    } catch (err) {
      emailError = (err as Error).message;
      console.error("[Schedule] Email confirmation failed:", emailError);
    }
  }

  // ── Send crew notification SMS ──────────────────────────────────────────────
  if (input.crewAssigned) {
    try {
      // Look up the crew member by name to get their phone number
      const crewRows = await db
        .select()
        .from(crewMembers)
        .where(eq(crewMembers.name, input.crewAssigned))
        .limit(1);
      const crewMember = crewRows[0];
      if (crewMember?.phone) {
        const customerName = `${lead.firstName} ${lead.lastName}`.trim();
        const address = lead.projectAddress || "address on file";
        const when = formatAppointmentDate(input.scheduledDate, input.timeSlot);
        const crewSmsBody = `New job assigned: ${customerName} at ${address} on ${when}. Reply CONFIRM to acknowledge.`;
        await sendSMS(crewSmsBody, crewMember.phone, input.leadId);
        console.log(`[Schedule] Crew SMS sent to ${crewMember.name} (${crewMember.phone})`);
      }
    } catch (crewSmsErr) {
      // Non-fatal: log but don't fail the booking
      console.warn("[Schedule] Crew SMS notification failed:", (crewSmsErr as Error).message);
    }
  }

  // Update smsSent / emailSent flags on the appointment record
  if (smsSent || emailSent) {
    await db
      .update(appointments)
      .set({ smsSent, emailSent })
      .where(eq(appointments.id, appointment.id));
  }

  // Log the appointment creation in the communication log
  try {
    const when = formatAppointmentDate(input.scheduledDate, input.timeSlot);
    const job = input.jobType ?? lead.projectType ?? "appointment";
    await db.insert(communicationLog).values({
      leadId: input.leadId,
      type: "system",
      direction: "internal",
      subject: `Appointment scheduled: ${job}`,
      content: `Appointment booked for ${when}${input.crewAssigned ? ` — Crew: ${input.crewAssigned}` : ""}. Confirmation SMS: ${smsSent ? "sent" : "not sent"}. Confirmation email: ${emailSent ? "sent" : "not sent"}.`,
      sentBy: input.createdBy ?? null,
    });
  } catch (logErr) {
    console.warn("[Schedule] Failed to log appointment creation:", (logErr as Error).message);
  }

  return {
    appointment: { ...appointment, smsSent, emailSent },
    smsSent,
    emailSent,
    smsError,
    emailError,
  };
}

/**
 * Updates an existing appointment's fields.
 * Does NOT automatically send notifications — callers handle that.
 */
export async function updateAppointment(
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateValues: Partial<InsertAppointment> = {};
  if (input.crewAssigned !== undefined) updateValues.crewAssigned = input.crewAssigned;
  if (input.jobType !== undefined) updateValues.jobType = input.jobType;
  if (input.scheduledDate !== undefined) updateValues.scheduledDate = input.scheduledDate;
  if (input.timeSlot !== undefined) updateValues.timeSlot = input.timeSlot;
  if (input.status !== undefined) updateValues.status = input.status;
  if (input.notes !== undefined) updateValues.notes = input.notes;

  if (Object.keys(updateValues).length > 0) {
    await db
      .update(appointments)
      .set(updateValues)
      .where(eq(appointments.id, input.id));
  }

  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, input.id))
    .limit(1);

  if (!rows[0]) throw new Error(`Appointment ${input.id} not found`);
  return rows[0];
}

/**
 * Cancels an appointment by setting its status to 'cancelled'.
 * Optionally logs a reason in the communication log.
 */
export async function cancelAppointment(
  id: number,
  reason?: string,
  cancelledBy?: number
): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(eq(appointments.id, id));

  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  const appointment = rows[0];
  if (!appointment) throw new Error(`Appointment ${id} not found`);

  // Log the cancellation
  try {
    await db.insert(communicationLog).values({
      leadId: appointment.leadId,
      type: "system",
      direction: "internal",
      subject: "Appointment cancelled",
      content: reason
        ? `Appointment cancelled. Reason: ${reason}`
        : "Appointment cancelled.",
      sentBy: cancelledBy ?? null,
    });
  } catch (logErr) {
    console.warn("[Schedule] Failed to log cancellation:", (logErr as Error).message);
  }

  return appointment;
}

// ─── Email helper ─────────────────────────────────────────────────────────────

/**
 * Sends a confirmation email using the Manus built-in notification API.
 * Falls back to console logging if credentials are not configured.
 */
async function sendConfirmationEmail(params: {
  to: string;
  subject: string;
  body: string;
  leadId: number;
}): Promise<void> {
  const { ENV } = await import("../_core/env");
  const forgeApiUrl = ENV.forgeApiUrl;
  const forgeApiKey = ENV.forgeApiKey;

  if (!forgeApiUrl || !forgeApiKey) {
    console.warn("[Schedule] Forge API not configured — email not sent to", params.to);
    // Still insert a communication log entry so the Activity tab shows it
    const db = await getDb();
    if (db) {
      await db.insert(communicationLog).values({
        leadId: params.leadId,
        type: "email",
        direction: "outbound",
        subject: params.subject,
        content: params.body,
      });
    }
    return;
  }

  // Use the Manus built-in email API
  const response = await fetch(`${forgeApiUrl}/v1/email/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${forgeApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: params.to,
      subject: params.subject,
      text: params.body,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Email API error ${response.status}: ${errText}`);
  }

  // Log the sent email in the communication log
  const db = await getDb();
  if (db) {
    await db.insert(communicationLog).values({
      leadId: params.leadId,
      type: "email",
      direction: "outbound",
      subject: params.subject,
      content: params.body,
    });
  }
}

// ─── Appointment Reminder (24-hour) ──────────────────────────────────────────
/**
 * Sends a 24-hour appointment reminder SMS to the customer.
 * Called by a scheduled job or manually from the appointments router.
 *
 * @param appointmentId  The appointment to send the reminder for
 * @param tenantId       Optional tenant identifier
 */
export async function sendAppointmentReminder(
  appointmentId: number,
  tenantId?: number
): Promise<{ sent: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { sent: false, error: "Database not available" };

  // Fetch appointment
  const apptRows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  const appt = apptRows[0];
  if (!appt) return { sent: false, error: `Appointment ${appointmentId} not found` };

  // Fetch lead for customer phone
  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, appt.leadId))
    .limit(1);
  const lead = leadRows[0];
  if (!lead?.phone) {
    console.warn(`[Schedule] No phone for lead ${appt.leadId} — reminder not sent`);
    return { sent: false, error: "No customer phone number" };
  }

  // Fetch business name from app settings
  const { appSettings } = await import("../../drizzle/schema");
  let businessName = "PaintPro CRM";
  try {
    const settingsRows = await db
      .select({ businessName: appSettings.businessName })
      .from(appSettings)
      .limit(1);
    businessName = settingsRows[0]?.businessName || businessName;
  } catch { /* non-fatal */ }

  // Build the appointment time string
  const appointmentTime = formatAppointmentDate(appt.scheduledDate, appt.timeSlot);

  const result = await sendAppointmentReminderSMS({
    customerPhone: lead.phone,
    businessName,
    appointmentTime,
  });

  // Log the reminder in communication log
  try {
    await db.insert(communicationLog).values({
      leadId: appt.leadId,
      type: "sms",
      direction: "outbound",
      subject: "Appointment Reminder",
      content: `24-hour reminder sent for appointment on ${appointmentTime}. SMS ${result.sent ? "delivered" : "failed"}.`,
      ...(tenantId ? {} : {}),
    });
  } catch (logErr) {
    console.warn("[Schedule] Failed to log reminder:", (logErr as Error).message);
  }

  return result;
}
