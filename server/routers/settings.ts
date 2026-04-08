import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ─── Default branding fallback ────────────────────────────────────────────────
const DEFAULT_BRANDING = {
  businessName: "PaintPro CRM",
  logoUrl: null as string | null,
  primaryColor: "#1e3a5f",
  secondaryColor: "#3b82f6",
};

export const settingsRouter = router({
  // ─── Public: get branding only (used by DashboardLayout before auth) ─────────
  getBranding: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return DEFAULT_BRANDING;
    const rows = await db.select().from(appSettings).limit(1);
    const s = rows[0];
    if (!s) return DEFAULT_BRANDING;
    return {
      businessName: s.businessName ?? DEFAULT_BRANDING.businessName,
      logoUrl: s.logoUrl ?? null,
      primaryColor: s.primaryColor ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: s.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
    };
  }),

  // ─── Protected: get full settings ────────────────────────────────────────────
  get: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {
      companyName: null, companyEmail: null, reviewLink: null,
      stripeEnabled: false, calendarEnabled: false,
      googleReviewLink: null, autoReviewEnabled: false,
      businessName: null, logoUrl: null, primaryColor: null, secondaryColor: null,
    };
    const rows = await db.select().from(appSettings).limit(1);
    const s = rows[0];
    if (!s) return {
      companyName: null, companyEmail: null, reviewLink: null,
      stripeEnabled: false, calendarEnabled: false,
      googleReviewLink: null, autoReviewEnabled: false,
      businessName: null, logoUrl: null, primaryColor: null, secondaryColor: null,
    };
    return {
      companyName: s.companyName,
      companyEmail: s.companyEmail,
      reviewLink: s.reviewLink,
      stripeEnabled: !!s.stripeSecretKey,
      calendarEnabled: !!s.googleCalendarId,
      googleReviewLink: s.googleReviewLink ?? null,
      autoReviewEnabled: s.autoReviewEnabled ?? false,
      businessName: s.businessName ?? null,
      logoUrl: s.logoUrl ?? null,
      primaryColor: s.primaryColor ?? null,
      secondaryColor: s.secondaryColor ?? null,
    };
  }),

  // ─── Protected: update settings (including branding text fields) ─────────────
  update: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      companyEmail: z.string().optional(),
      reviewLink: z.string().optional(),
      stripeSecretKey: z.string().optional(),
      googleCalendarId: z.string().optional(),
      googleReviewLink: z.string().optional(),
      autoReviewEnabled: z.boolean().optional(),
      // Branding fields
      businessName: z.string().max(200).optional(),
      primaryColor: z.string().max(20).optional(),
      secondaryColor: z.string().max(20).optional(),
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
          businessName: input.businessName || null,
          primaryColor: input.primaryColor || null,
          secondaryColor: input.secondaryColor || null,
        });
      } else {
        const updateData: Record<string, unknown> = {};
        if (input.companyName !== undefined) updateData.companyName = input.companyName;
        if (input.companyEmail !== undefined) updateData.companyEmail = input.companyEmail;
        if (input.reviewLink !== undefined) updateData.reviewLink = input.reviewLink;
        if (input.stripeSecretKey !== undefined) updateData.stripeSecretKey = input.stripeSecretKey;
        if (input.googleCalendarId !== undefined) updateData.googleCalendarId = input.googleCalendarId;
        if (input.googleReviewLink !== undefined) updateData.googleReviewLink = input.googleReviewLink;
        if (input.autoReviewEnabled !== undefined) updateData.autoReviewEnabled = input.autoReviewEnabled;
        if (input.businessName !== undefined) updateData.businessName = input.businessName;
        if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;
        if (input.secondaryColor !== undefined) updateData.secondaryColor = input.secondaryColor;
        await db.update(appSettings).set(updateData).where(eq(appSettings.id, rows[0].id));
      }
      return { success: true };
    }),

  // ─── Protected: upload logo to S3 ────────────────────────────────────────────
  uploadLogo: protectedProcedure
    .input(z.object({
      base64Data: z.string(),
      mimeType: z.string().regex(/^image\/(jpeg|png|gif|webp|svg\+xml)$/),
      originalName: z.string().max(300),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Decode base64 to buffer
      const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const ext = input.mimeType.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
      const fileKey = `branding/logo-${nanoid(12)}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Persist to settings row
      const rows = await db.select().from(appSettings).limit(1);
      if (rows.length === 0) {
        await db.insert(appSettings).values({ logoUrl: url, logoKey: fileKey });
      } else {
        await db.update(appSettings)
          .set({ logoUrl: url, logoKey: fileKey })
          .where(eq(appSettings.id, rows[0].id));
      }

      return { success: true, logoUrl: url };
    }),

  // ─── Protected: remove logo ───────────────────────────────────────────────────
  removeLogo: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select().from(appSettings).limit(1);
    if (rows.length > 0) {
      await db.update(appSettings)
        .set({ logoUrl: null, logoKey: null })
        .where(eq(appSettings.id, rows[0].id));
    }
    return { success: true };
  }),
});
