/**
 * sms router — tRPC procedures for the SMS conversation thread
 *
 * Procedures:
 *   sms.list    — list all conversations for a lead (newest first)
 *   sms.send    — send an outbound SMS via Twilio and persist to DB
 *   sms.status  — returns whether Twilio credentials are configured
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { conversations } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendSMS } from "../services/sms";
import { ENV } from "../_core/env";

export const smsRouter = router({
  /**
   * Returns all SMS messages for a given lead, ordered oldest → newest
   * so the chat thread renders in chronological order.
   */
  list: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(conversations)
        .where(eq(conversations.leadId, input.leadId))
        .orderBy(conversations.createdAt);
      return rows;
    }),

  /**
   * Sends an outbound SMS to the given phone number and persists the message.
   * Uses the Twilio credentials from environment variables.
   */
  send: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        to: z.string().min(7, "Phone number required"),
        message: z.string().min(1, "Message body required").max(1600),
        tenantId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendSMS(
        input.to,
        input.message,
        input.leadId,
        input.tenantId
      );
      if (!result.success) {
        // Return the result with the error so the UI can display a warning
        // without throwing — the message is still persisted as failed/not_configured
        return { ...result, persisted: true };
      }
      return { ...result, persisted: true };
    }),

  /**
   * Returns whether Twilio credentials are present in the environment.
   * Used by the frontend to show a configuration warning when not set up.
   */
  status: protectedProcedure.query(() => {
    return {
      configured: !!(
        ENV.twilioAccountSid &&
        ENV.twilioAuthToken &&
        ENV.twilioPhoneNumber
      ),
      fromNumber: ENV.twilioPhoneNumber || null,
    };
  }),
});
