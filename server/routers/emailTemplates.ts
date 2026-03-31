import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAutomationRule,
  createEmailTemplate,
  deleteAutomationRule,
  deleteEmailTemplate,
  getAutomationRuleById,
  getAutomationRules,
  getEmailTemplateById,
  getEmailTemplates,
  updateAutomationRule,
  updateEmailTemplate,
} from "../db";

const triggerStageEnum = z.enum([
  "lead",
  "quoted",
  "scheduled",
  "in_progress",
  "completed",
  "paid",
  "manual",
]);

const triggerTypeEnum = z.enum([
  "stage_change",
  "scheduled",
  "manual",
  "days_after_stage",
]);

export const emailTemplatesRouter = router({
  list: protectedProcedure.query(async () => {
    return getEmailTemplates();
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getEmailTemplateById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        triggerStage: triggerStageEnum.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createEmailTemplate(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          subject: z.string().min(1).optional(),
          body: z.string().optional(),
          triggerStage: triggerStageEnum.optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await updateEmailTemplate(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteEmailTemplate(input.id);
      return { success: true };
    }),
});

export const automationRulesRouter = router({
  list: protectedProcedure.query(async () => {
    const rules = await getAutomationRules();
    const templates = await (async () => {
      const { getEmailTemplates } = await import("../db");
      return getEmailTemplates();
    })();
    const templateMap = new Map(templates.map((t) => [t.id, t]));
    return rules.map((r) => ({
      ...r,
      template: templateMap.get(r.templateId) || null,
    }));
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getAutomationRuleById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        triggerType: triggerTypeEnum,
        triggerStage: z.enum(["lead","quoted","scheduled","in_progress","completed","paid"]).optional(),
        delayHours: z.number().optional(),
        templateId: z.number(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createAutomationRule(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          triggerType: triggerTypeEnum.optional(),
          triggerStage: z.enum(["lead","quoted","scheduled","in_progress","completed","paid"]).optional(),
          delayHours: z.number().optional(),
          templateId: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await updateAutomationRule(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAutomationRule(input.id);
      return { success: true };
    }),
});
