import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = router({
  get: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { companyName: null, companyEmail: null, reviewLink: null, stripeEnabled: false, calendarEnabled: false };
    const rows = await db.select().from(appSettings).limit(1);
    const s = rows[0];
    if (!s) return { companyName: null, companyEmail: null, reviewLink: null, stripeEnabled: false, calendarEnabled: false };
    return {
      companyName: s.companyName,
      companyEmail: s.companyEmail,
      reviewLink: s.reviewLink,
      stripeEnabled: !!s.stripeSecretKey,
      calendarEnabled: !!s.googleCalendarId,
    };
  }),

  update: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      companyEmail: z.string().optional(),
      reviewLink: z.string().optional(),
      stripeSecretKey: z.string().optional(),
      googleCalendarId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(appSettings).limit(1);
      if (rows.length === 0) {
        await db.insert(appSettings).values({
          companyName: input.companyName || null,
          companyEmail: input.companyEmail || null,
          reviewLink: input.reviewLink || null,
          stripeSecretKey: input.stripeSecretKey || null,
          googleCalendarId: input.googleCalendarId || null,
        });
      } else {
        const updateData: Record<string, string | null> = {};
        if (input.companyName !== undefined) updateData.companyName = input.companyName;
        if (input.companyEmail !== undefined) updateData.companyEmail = input.companyEmail;
        if (input.reviewLink !== undefined) updateData.reviewLink = input.reviewLink;
        if (input.stripeSecretKey !== undefined) updateData.stripeSecretKey = input.stripeSecretKey;
        if (input.googleCalendarId !== undefined) updateData.googleCalendarId = input.googleCalendarId;
        await db.update(appSettings).set(updateData).where(eq(appSettings.id, rows[0].id));
      }
      return { success: true };
    }),
});
