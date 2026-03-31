import { protectedProcedure, router } from "../_core/trpc";
import { getDashboardStats } from "../db";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    return getDashboardStats();
  }),
});
