import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createLead,
  createCommunicationLogEntry,
  deleteLead,
  getLeadById,
  getLeads,
  getLeadsByStage,
  getRulesByTriggerStage,
  getEmailTemplateById,
  updateLead,
} from "../db";

const stageEnum = z.enum([
  "lead",
  "quoted",
  "scheduled",
  "in_progress",
  "completed",
  "paid",
]);

const leadInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  projectType: z.string().optional(),
  projectAddress: z.string().optional(),
  projectDescription: z.string().optional(),
  estimatedValue: z.string().optional(),
  source: z.string().optional(),
  stage: stageEnum.optional(),
  scheduledDate: z.string().optional(),
});

function interpolateTemplate(body: string, lead: Record<string, unknown>): string {
  return body
    .replace(/\{customer_name\}/g, `${lead.firstName} ${lead.lastName}`)
    .replace(/\{first_name\}/g, String(lead.firstName || ""))
    .replace(/\{last_name\}/g, String(lead.lastName || ""))
    .replace(/\{project_type\}/g, String(lead.projectType || "your project"))
    .replace(/\{project_address\}/g, String(lead.projectAddress || ""))
    .replace(/\{quote_amount\}/g, lead.estimatedValue ? `$${lead.estimatedValue}` : "TBD")
    .replace(/\{remaining_balance\}/g, lead.estimatedValue ? `$${lead.estimatedValue}` : "TBD")
    .replace(/\{payment_link\}/g, String(lead.stripePaymentLinkUrl || "#"))
    .replace(/\{scheduled_date\}/g, lead.scheduledDate ? new Date(lead.scheduledDate as string).toLocaleDateString() : "TBD")
    .replace(/\{scheduled_time\}/g, lead.scheduledDate ? new Date(lead.scheduledDate as string).toLocaleTimeString() : "TBD")
    .replace(/\{company_name\}/g, "Your Company")
    .replace(/\{review_link\}/g, "#")
    .replace(/\{project_duration\}/g, "1-3 days");
}

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        stage: stageEnum.optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getLeads(input);
    }),

  kanban: protectedProcedure.query(async () => {
    const all = await getLeadsByStage();
    const stages: Record<string, typeof all> = {
      lead: [],
      quoted: [],
      scheduled: [],
      in_progress: [],
      completed: [],
      paid: [],
    };
    for (const lead of all) {
      if (stages[lead.stage]) stages[lead.stage].push(lead);
    }
    return stages;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getLeadById(input.id);
    }),

  create: protectedProcedure
    .input(leadInput)
    .mutation(async ({ input, ctx }) => {
      const data = {
        ...input,
        estimatedValue: input.estimatedValue || undefined,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        createdBy: ctx.user.id,
        lastContactedAt: new Date(),
      };
      const result = await createLead(data);

      // Log creation
      await createCommunicationLogEntry({
        leadId: (result as { insertId?: number })?.insertId || 0,
        type: "system",
        direction: "internal",
        subject: "Lead Created",
        content: `New lead created: ${input.firstName} ${input.lastName}`,
        sentBy: ctx.user.id,
      });

      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: leadInput.partial() }))
    .mutation(async ({ input }) => {
      const data = {
        ...input.data,
        scheduledDate: input.data.scheduledDate
          ? new Date(input.data.scheduledDate)
          : undefined,
      };
      await updateLead(input.id, data);
      return { success: true };
    }),

  updateStage: protectedProcedure
    .input(z.object({ id: z.number(), stage: stageEnum }))
    .mutation(async ({ input, ctx }) => {
      const lead = await getLeadById(input.id);
      if (!lead) throw new Error("Lead not found");

      const updateData: Record<string, unknown> = {
        stage: input.stage,
        lastContactedAt: new Date(),
      };

      if (input.stage === "completed") updateData.completedDate = new Date();
      if (input.stage === "paid") updateData.paidAt = new Date();

      await updateLead(input.id, updateData);

      // Log stage change
      await createCommunicationLogEntry({
        leadId: input.id,
        type: "system",
        direction: "internal",
        subject: "Stage Updated",
        content: `Stage changed from "${lead.stage}" to "${input.stage}"`,
        sentBy: ctx.user.id,
      });

      // Fire automation rules
      const rules = await getRulesByTriggerStage(input.stage);
      for (const rule of rules) {
        if (rule.delayHours && rule.delayHours > 0) continue; // Skip delayed for now
        const template = await getEmailTemplateById(rule.templateId);
        if (!template) continue;

        const leadRecord = { ...lead, ...updateData } as Record<string, unknown>;
        const interpolatedBody = interpolateTemplate(template.body, leadRecord);
        const interpolatedSubject = interpolateTemplate(template.subject, leadRecord);

        await createCommunicationLogEntry({
          leadId: input.id,
          type: "email",
          direction: "outbound",
          subject: interpolatedSubject,
          content: interpolatedBody,
          templateId: template.id,
          automationRuleId: rule.id,
          sentBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLead(input.id);
      return { success: true };
    }),
});
