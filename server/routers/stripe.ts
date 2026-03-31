import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getLeadById, updateLead, createCommunicationLogEntry } from "../db";

export const stripeRouter = router({
  createPaymentLink: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        amount: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) throw new Error("Lead not found");

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        // Return mock link when Stripe is not configured
        const mockUrl = `https://buy.stripe.com/test_mock_${input.leadId}_${Date.now()}`;
        await updateLead(input.leadId, { stripePaymentLinkUrl: mockUrl });
        await createCommunicationLogEntry({
          leadId: input.leadId,
          type: "system",
          direction: "internal",
          subject: "Payment Link Generated (Mock)",
          content: `Mock payment link created for $${input.amount}. Configure STRIPE_SECRET_KEY to enable real payments.`,
          sentBy: ctx.user.id,
        });
        return { url: mockUrl, mock: true };
      }

      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: input.description || `${lead.projectType || "Project"} - ${lead.firstName} ${lead.lastName}`,
                },
                unit_amount: Math.round(input.amount * 100),
              },
              quantity: 1,
            },
          ],
        });

        await updateLead(input.leadId, {
          stripePaymentLinkUrl: paymentLink.url,
        });

        await createCommunicationLogEntry({
          leadId: input.leadId,
          type: "system",
          direction: "internal",
          subject: "Payment Link Generated",
          content: `Stripe payment link created for $${input.amount}: ${paymentLink.url}`,
          sentBy: ctx.user.id,
        });

        return { url: paymentLink.url, mock: false };
      } catch (err) {
        throw new Error(`Stripe error: ${(err as Error).message}`);
      }
    }),

  markPaid: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateLead(input.leadId, {
        stage: "paid",
        paidAt: new Date(),
      });
      await createCommunicationLogEntry({
        leadId: input.leadId,
        type: "system",
        direction: "internal",
        subject: "Payment Received",
        content: "Payment marked as received. Lead moved to Paid stage.",
        sentBy: ctx.user.id,
      });
      return { success: true };
    }),
});
