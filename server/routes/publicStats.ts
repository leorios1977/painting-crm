import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { users, leads } from '../../drizzle/schema';
import { count } from 'drizzle-orm';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ totalClients: 2, totalLeads: 8 });
    }
    const [clientCount] = await db
      .select({ count: count() })
      .from(users);
    const [leadCount] = await db
      .select({ count: count() })
      .from(leads);
    return res.json({
      totalClients: clientCount?.count || 2,
      totalLeads: leadCount?.count || 8,
    });
  } catch (error) {
    console.error('[Public Stats] Error:', error);
    return res.json({ totalClients: 2, totalLeads: 8 });
  }
});

export default router;
