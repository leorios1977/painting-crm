export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      projectAddress,
      projectType,
      projectDescription,
      source,
      tenantId,
      timeline,
      budget,
    } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ 
        error: 'Phone or email is required.' 
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            tenantId: tenantId || 1,
            firstName: firstName || '',
            lastName: lastName || '',
            email: email || '',
            phone: phone || '',
            projectType: projectType || 'General Inquiry',
            projectAddress: projectAddress || '',
            projectDescription: `${projectDescription || ''} | Timeline: ${timeline || 'Not specified'} | Budget: ${budget || 'Not specified'} | Source: ${source || 'website'}`,
            stage: 'new',
            source: source || 'website',
          }),
        });
      } catch (dbErr) {
        console.error('[Public Lead] DB error:', dbErr);
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'PaintersMax <noreply@mail.paintersmax.app>',
            to: ['agentflowfounder@gmail.com'],
            subject: `🎨 New Lead — ${projectType || 'Painting Request'} (${source || 'website'})`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#ea580c;padding:24px;border-radius:12px 12px 0 0;">
                  <h1 style="color:white;margin:0;font-size:24px;">🎨 New Painting Lead</h1>
                  <p style="color:#fed7aa;margin:8px 0 0;">From: ${source || 'website'}</p>
                </div>
                <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:40%;">Name</td><td style="padding:8px 0;font-weight:600;">${firstName || ''} ${lastName || ''}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px 4px;color:#6b7280;font-size:14px;">Phone</td><td style="padding:8px 4px;"><a href="tel:${phone}" style="color:#ea580c;">${phone || 'Not provided'}</a></td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#ea580c;">${email || 'Not provided'}</a></td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px 4px;color:#6b7280;font-size:14px;">Address</td><td style="padding:8px 4px;">${projectAddress || 'Not provided'}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Service</td><td style="padding:8px 0;font-weight:600;">${projectType || 'Not specified'}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px 4px;color:#6b7280;font-size:14px;">Timeline</td><td style="padding:8px 4px;">${timeline || 'Not specified'}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Budget</td><td style="padding:8px 0;">${budget || 'Not specified'}</td></tr>
                  </table>
                  ${projectDescription ? `
                  <div style="background:#fff7ed;border-left:4px solid #ea580c;padding:16px;margin-top:20px;border-radius:0 8px 8px 0;">
                    <p style="color:#9a3412;font-weight:600;margin:0 0 8px;font-size:14px;">Project Details:</p>
                    <p style="color:#7c2d12;margin:0;font-size:14px;line-height:1.6;">${projectDescription}</p>
                  </div>` : ''}
                  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
                    <p style="color:#6b7280;font-size:12px;margin:0;">Lead received via PaintersMax platform · Follow up within 2 hours for best results.</p>
                  </div>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[Public Lead] Email error:', emailErr);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Lead received!' 
    });

  } catch (error) {
    console.error('[Public Lead] Error:', error);
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again.' 
    });
  }
}
