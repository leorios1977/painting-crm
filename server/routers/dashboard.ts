/**
 * dashboard.ts — tRPC router for the Dashboard page
 *
 * Provides two procedures:
 *   - stats: returns all four live KPI metrics plus pipeline stage counts,
 *            upcoming appointments, and recent activity
 *   - metrics: returns only the four top-level KPI numbers (for fast initial load)
 *
 * All four stat-card values are computed with direct SQL aggregates:
 *   1. totalLeads         — COUNT(*) from leads
 *   2. pipelineValue      — SUM(estimatedValue) from leads (all active stages)
 *   3. revenueCollected   — SUM(total) from invoices WHERE status = 'paid'
 *   4. upcomingJobsCount  — COUNT(*) from appointments WHERE scheduledDate
 *                           is within the next 7 days and status != 'cancelled'
 */
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  leads,
  invoices,
  appointments,
  communicationLog,
} from "../../drizzle/schema";
import { and, eq, gte, lt, ne, sql, desc } from "drizzle-orm";

export const dashboardRouter = router({
  /**
   * Returns all dashboard data in a single query batch:
   *   - Four KPI metrics (live SQL aggregates)
   *   - Pipeline stage counts
   *   - Upcoming appointments list (next 7 days, up to 5)
   *   - Recent activity log (last 10 entries)
   */
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // ── 1. Total leads count ──────────────────────────────────────────────────
    const [totalLeadsRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads);
    const totalLeads = Number(totalLeadsRow?.count ?? 0);

    // ── 2. Pipeline value — sum of estimatedValue across all leads ────────────
    const [pipelineValueRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(estimatedValue), 0)` })
      .from(leads);
    const pipelineValue = parseFloat(pipelineValueRow?.total ?? "0");

    // ── 3. Revenue collected — sum of invoices.total where status = 'paid' ────
    const [revenueRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(invoices)
      .where(eq(invoices.status, "paid"));
    const revenueCollected = parseFloat(revenueRow?.total ?? "0");

    // ── 4. Upcoming jobs count — appointments in the next 7 days ─────────────
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
      // Legacy fields kept for backward compatibility with existing UI
      totalRevenue: pipelineValue,
      paidRevenue: revenueCollected,
      // Pipeline
      stageCounts,
      // Widgets
      upcomingJobs,
      recentActivity,
    };
  }),
});
