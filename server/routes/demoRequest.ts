import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { leads } from '../../drizzle/schema';
import { sendNewLeadNotification } from '../services/email';

const router = Router();

router.post('/demo-request', async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      city,
      state,
      currentChallenge,
      interestedTier,
      heardFrom,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !companyName || !city) {
      return res.status(400).json({ 
        error: 'Please fill in all required fields.' 
      });
    }

    const db = await getDb();
    
    if (db) {
      await db.insert(leads).values({
        tenantId: 1,
        firstName,
        lastName,
        email,
        phone,
        projectType: `Demo Request — ${interestedTier || 'Not specified'}`,
        projectAddress: `${city}, ${state}`,
        projectDescription: `Challenge: ${currentChallenge || 'Not provided'} | Heard from: ${heardFrom || 'Not provided'}`,
        stage: 'lead',
        source: heardFrom || 'website',
      });
    }

    // Send email notification to agentflowfounder@gmail.com
    await sendNewLeadNotification({
      ownerEmail: 'agentflowfounder@gmail.com',
      businessName: 'PaintersMax',
      leadFirstName: firstName,
      leadLastName: lastName,
      leadEmail: email,
      leadPhone: phone,
      leadSource: heardFrom || 'website',
      notes: `Company: ${companyName}\nTier Interest: ${interestedTier || 'Not specified'}\nChallenge: ${currentChallenge}`,
    });

    return res.json({ 
      success: true, 
      message: 'Demo request received!' 
    });

  } catch (error) {
    console.error('[Demo Request] Error:', error);
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again.' 
    });
  }
});

export default router;
