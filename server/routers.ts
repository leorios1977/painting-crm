import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { leadsRouter } from "./routers/leads";
import { emailTemplatesRouter, automationRulesRouter } from "./routers/emailTemplates";
import { communicationsRouter, attachmentsRouter } from "./routers/communications";
import { dashboardRouter } from "./routers/dashboard";
import { stripeRouter } from "./routers/stripe";
import { settingsRouter } from "./routers/settings";
import { smsRouter } from "./routers/sms";
import { appointmentsRouter } from "./routers/appointments";
import { invoicesRouter } from "./routers/invoices";
import { seedDefaultTemplates } from "./db";

// Seed default templates on startup
seedDefaultTemplates().catch(console.error);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  leads: leadsRouter,
  emailTemplates: emailTemplatesRouter,
  automationRules: automationRulesRouter,
  communications: communicationsRouter,
  attachments: attachmentsRouter,
  dashboard: dashboardRouter,
  stripe: stripeRouter,
  settings: settingsRouter,
  sms: smsRouter,
  appointments: appointmentsRouter,
  invoices: invoicesRouter,
});

export type AppRouter = typeof appRouter;
