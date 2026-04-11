/**
 * dashboard.ts — tRPC router for the Dashboard page
 *
 * Provides a `stats` procedure that accepts an optional `dateRange` parameter:
 *   - "this_month"  — from the 1st of the current calendar month to now
 *   - "last_30"     — from 30 days ago to now
 *   - "all_time"    — no date restriction (default)
 *
 * KPI metrics returned:
 *   1. totalLeads         — COUNT(*) from leads (within range)
 *   2. pipelineValue      — SUM(estimatedValue) from leads (within range)
 *   3. revenueCollected   — SUM(total) from invoices WHERE status = 'paid' (within range)
 *   4. upcomingJobsCount  — COUNT(*) from appointments in the next 7 days (always live, no range)
 *   5. conversionRate     — paidLeads / totalLeads * 100 (within range)
 */
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  leads,
  invoices,
  appointments,
  communicationLog,
} from "../../drizzle/schema";
import { and, eq, gte, lt, lte, ne, sql, desc } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = router({
  /**
   * Returns all dashboard data in a single query batch.
   * Accepts optional dateRange to filter KPI metrics.
   */
  stats: protectedProcedure
    .input(
      z.object({
        dateRange: z.enum(["this_month", "last_30", "all_time"]).optional().default("all_time"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const dateRange = input?.dateRange ?? "all_time";
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // ── Compute range start date ────────────────────────────────────────────
      let rangeStart: Date | null = null;
      if (dateRange === "this_month") {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === "last_30") {
        rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // ── 1. Total leads count (with optional date filter on createdAt) ───────
      const leadsFilter = rangeStart
        ? gte(leads.createdAt, rangeStart)
        : undefined;

      const [totalLeadsRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(leadsFilter);
      const totalLeads = Number(totalLeadsRow?.count ?? 0);

      // ── 2. Pipeline value ────────────────────────────────────────────────────
      const [pipelineValueRow] = await db
        .select({ total: sql<string>`COALESCE(SUM(estimatedValue), 0)` })
        .from(leads)
        .where(leadsFilter);
      const pipelineValue = parseFloat(pipelineValueRow?.total ?? "0");

      // ── 3. Revenue collected ─────────────────────────────────────────────────
      const invoicesFilter = rangeStart
        ? and(eq(invoices.status, "paid"), gte(invoices.paidAt, rangeStart))
        : eq(invoices.status, "paid");

      const [revenueRow] = await db
        .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
        .from(invoices)
        .where(invoicesFilter);
      const revenueCollected = parseFloat(revenueRow?.total ?? "0");

      // ── 4. Upcoming jobs count (always next 7 days, no range filter) ─────────
      const [upcomingCountRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(appointments)
        .where(
          and(
            gte(appointments.scheduledDate, now),
            lt(appointments.scheduledDate, nextWeek),
            ne(appointments.status, "cancelled")
          )
        );
      const upcomingJobsCount = Number(upcomingCountRow?.count ?? 0);

      // ── 5. Conversion rate — paid leads / total leads * 100 ──────────────────
      const [paidLeadsRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(
          leadsFilter
            ? and(eq(leads.stage, "paid"), leadsFilter)
            : eq(leads.stage, "paid")
        );
      const paidLeads = Number(paidLeadsRow?.count ?? 0);
      const conversionRate = totalLeads > 0
        ? Math.round((paidLeads / totalLeads) * 100 * 10) / 10
        : 0;

      // ── Pipeline stage counts ─────────────────────────────────────────────────
      const stageRows = await db
        .select({
          stage: leads.stage,
          count: sql<number>`COUNT(*)`,
        })
        .from(leads)
        .groupBy(leads.stage);

      const stageCounts: Record<string, number> = {
        lead: 0,
        quoted: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        paid: 0,
      };
      for (const row of stageRows) {
        stageCounts[row.stage] = Number(row.count);
      }

      // ── Upcoming appointments list (for the sidebar widget) ───────────────────
      const upcomingAppointments = await db
        .select({
          id: appointments.id,
          leadId: appointments.leadId,
          jobType: appointments.jobType,
          scheduledDate: appointments.scheduledDate,
          timeSlot: appointments.timeSlot,
          status: appointments.status,
          crewAssigned: appointments.crewAssigned,
        })
        .from(appointments)
        .where(
          and(
            gte(appointments.scheduledDate, now),
            lt(appointments.scheduledDate, nextWeek),
            ne(appointments.status, "cancelled")
          )
        )
        .orderBy(appointments.scheduledDate)
        .limit(5);

      // Fetch lead names for each upcoming appointment
      const leadIds = Array.from(new Set(upcomingAppointments.map((a) => a.leadId)));
      const leadNameMap: Record<number, { firstName: string; lastName: string; projectType: string | null }> = {};
      if (leadIds.length > 0) {
        const leadRows = await db
          .select({
            id: leads.id,
            firstName: leads.firstName,
            lastName: leads.lastName,
            projectType: leads.projectType,
          })
          .from(leads)
          .where(sql`${leads.id} IN (${sql.join(leadIds.map((id) => sql`${id}`), sql`, `)})`);
        for (const row of leadRows) {
          leadNameMap[row.id] = {
            firstName: row.firstName,
            lastName: row.lastName,
            projectType: row.projectType,
          };
        }
      }

      const upcomingJobs = upcomingAppointments.map((appt) => ({
        id: appt.id,
        leadId: appt.leadId,
        jobType: appt.jobType,
        scheduledDate: appt.scheduledDate,
        timeSlot: appt.timeSlot,
        status: appt.status,
        crewAssigned: appt.crewAssigned,
        firstName: leadNameMap[appt.leadId]?.firstName ?? "",
        lastName: leadNameMap[appt.leadId]?.lastName ?? "",
        projectType: leadNameMap[appt.leadId]?.projectType ?? appt.jobType ?? null,
      }));

      // ── Recent activity ───────────────────────────────────────────────────────
      const recentActivity = await db
        .select()
        .from(communicationLog)
        .orderBy(desc(communicationLog.sentAt))
        .limit(10);

      return {
        // KPI metrics
        totalLeads,
        pipelineValue,
        revenueCollected,
        upcomingJobsCount,
        conversionRate,
        paidLeads,
        // Legacy fields kept for backward compatibility
        totalRevenue: pipelineValue,
        paidRevenue: revenueCollected,
        // Pipeline
        stageCounts,
        // Widgets
        upcomingJobs,
        recentActivity,
        // Active date range (echo back for UI)
        dateRange,
      };
    }),
});
