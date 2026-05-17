import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers — allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 
    'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed' 
    });
  }

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

    // Validate required fields
    if (!firstName || !lastName || !email || 
        !phone || !companyName || !city) {
      return res.status(400).json({ 
        error: 'Please fill in all required fields.' 
      });
    }

    // Save to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          tenantId: 1,
          firstName,
          lastName,
          email,
          phone,
          projectType: `Demo Request — ${interestedTier || 'Not specified'}`,
          projectAddress: `${city}, ${state || 'TX'}`,
          projectDescription: `Challenge: ${currentChallenge || 'Not provided'} | Heard from: ${heardFrom || 'Not provided'}`,
          stage: 'new',
          source: heardFrom || 'website',
        }),
      });
    }

    // Send email notification via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'PaintersMax <noreply@paintersmax.app>',
          to: ['agentflowfounder@gmail.com'],
          subject: `🎯 New Demo Request — ${companyName} (${city}, ${state || 'TX'})`,
          html: `
            <div style="font-family: sans-serif; 
              max-width: 600px; margin: 0 auto;">
              <div style="background: #2563eb; padding: 24px; 
                border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; 
                  font-size: 24px;">
                  🎯 New Demo Request
                </h1>
                <p style="color: #bfdbfe; margin: 8px 0 0;">
                  PaintersMax — Incoming Lead
                </p>
              </div>
              <div style="background: white; padding: 24px; 
                border: 1px solid #e5e7eb; border-top: none; 
                border-radius: 0 0 12px 12px;">
                <table style="width:100%; 
                  border-collapse: collapse;">
                  <tr>
                    <td style="padding:8px 0; 
                      color:#6b7280; font-size:14px; 
                      width:40%;">Name</td>
                    <td style="padding:8px 0; 
                      font-weight:600;">
                      \${firstName} \${lastName}
                    </td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:8px 4px; 
                      color:#6b7280; font-size:14px;">
                      Company
                    </td>
                    <td style="padding:8px 4px; 
                      font-weight:600;">
                      \${companyName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; 
                      color:#6b7280; font-size:14px;">
                      Email
                    </td>
                    <td style="padding:8px 0;">
                      <a href="mailto:\${email}" 
                        style="color:#2563eb;">
                        \${email}
                      </a>
                    </td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:8px 4px; 
                      color:#6b7280; font-size:14px;">
                      Phone
                    </td>
                    <td style="padding:8px 4px;">
                      <a href="tel:\${phone}" 
                        style="color:#2563eb;">
                        \${phone}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; 
                      color:#6b7280; font-size:14px;">
                      Location
                    </td>
                    <td style="padding:8px 0;">
                      \${city}, \${state || 'TX'}
                    </td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:8px 4px; 
                      color:#6b7280; font-size:14px;">
                      Interested Tier
                    </td>
                    <td style="padding:8px 4px; 
                      font-weight:600; color:#2563eb; 
                      text-transform:capitalize;">
                      \${interestedTier || 'Not specified'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; 
                      color:#6b7280; font-size:14px;">
                      Heard From
                    </td>
                    <td style="padding:8px 0; 
                      text-transform:capitalize;">
                      \${heardFrom || 'Not specified'}
                    </td>
                  </tr>
                </table>
                <div style="background:#eff6ff; 
                  border-left:4px solid #2563eb; 
                  padding:16px; margin-top:20px; 
                  border-radius:0 8px 8px 0;">
                  <p style="color:#1e40af; 
                    font-weight:600; margin:0 0 8px; 
                    font-size:14px;">
                    Their Biggest Challenge:
                  </p>
                  <p style="color:#1e3a8a; margin:0; 
                    font-size:14px; line-height:1.6;">
                    \${currentChallenge || 'Not provided'}
                  </p>
                </div>
                <div style="margin-top:24px; 
                  padding-top:20px; 
                  border-top:1px solid #e5e7eb;">
                  <p style="color:#6b7280; 
                    font-size:12px; margin:0;">
                    Submitted via paintersmax.app/contact
                    · Reach out within 24 hours to lock 
                    in their founding member rate.
                  </p>
                </div>
              </div>
            </div>
          `,
        }),
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Demo request received!' 
    });

  } catch (error) {
    console.error('[Demo Request] Error:', error);
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again.' 
    });
  }
}
