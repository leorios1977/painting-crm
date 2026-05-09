// api/notify-lead.ts
// Vercel API Route — fires every time a lead submits on dfw-propainters.com
// Sends: SMS to customer + SMS to both owners + email to customer
//
// ENV VARS required in Vercel (Settings → Environment Variables):
//   TWILIO_ACCOUNT_SID     → AC... (from Twilio Console homepage)
//   TWILIO_API_KEY         → SK... (the restricted key you just created)
//   TWILIO_API_SECRET      → secret shown once at key creation
//   TWILIO_PHONE_NUMBER    → +1XXXXXXXXXX (your Twilio sending number)
//   RESEND_API_KEY         → re_... (from resend.com → API Keys)
//   NOTIFY_OWNER_1         → +19037148120 (Rogelio's cell — with +1)
//   NOTIFY_OWNER_2         → +1XXXXXXXXXX (partner's cell — with +1)
//   NEXT_PUBLIC_PORTAL_URL → https://portal.dfw-propainters.com

import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Types ────────────────────────────────────────────────────
interface NotifyPayload {
  leadId:     number;
  firstName:  string;
  phone?:     string;
  email?:     string;
  service?:   string;
  portalUrl:  string;
  imageCount: number;
}

interface NotifyResult {
  success:     boolean;
  smsSent:     boolean;
  emailSent:   boolean;
  ownersSms:   boolean;
  errors:      string[];
}

// ─── Helpers ──────────────────────────────────────────────────

// Normalize phone to E.164 (+1XXXXXXXXXX)
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

// Send one SMS via Twilio
async function sendSMS(to: string, body: string): Promise<void> {
  const sid    = process.env.TWILIO_ACCOUNT_SID!;
  const key    = process.env.TWILIO_API_KEY!;
  const secret = process.env.TWILIO_API_SECRET!;
  const from   = process.env.TWILIO_PHONE_NUMBER!;

  const url  = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth  = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

// Send email via Resend
async function sendEmail(
  to: string,
  firstName: string,
  service: string,
  portalUrl: string,
  imageCount: number
): Promise<void> {
  const key = process.env.RESEND_API_KEY!;

  const imageNote = imageCount > 0
    ? `<p style="color:#666;font-size:14px;">📎 You attached ${imageCount} photo${imageCount > 1 ? 's' : ''} to your request. Your painter can see them.</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:#0D0D0D;padding:28px 36px;text-align:center;">
                <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  🖌️ <span style="color:#F59E0B;">DFW Pro</span> Painters
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 36px 24px;">
                <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;">
                  Hi ${firstName}! We got your request. 👋
                </h1>
                <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
                  Thanks for reaching out about your <strong>${service || 'painting'}</strong> project.
                  We'll review your details and call you within <strong>2 hours</strong>.
                </p>
                ${imageNote}
              </td>
            </tr>

            <!-- Portal CTA -->
            <tr>
              <td style="padding:0 36px 32px;">
                <div style="background:#FFFBF0;border:1.5px solid #F59E0B;border-radius:12px;padding:24px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#B45309;text-transform:uppercase;letter-spacing:0.05em;">
                    Your Project Portal
                  </p>
                  <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
                    Track your quote, view photos, approve work, and pay your invoice — all in one place.
                  </p>
                  <a href="${portalUrl}"
                     style="display:inline-block;background:#F59E0B;color:#000000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                    Track My Project →
                  </a>
                  <p style="margin:12px 0 0;font-size:11px;color:#999;">
                    Bookmark this link — it's your personal project page
                  </p>
                </div>
              </td>
            </tr>

            <!-- What happens next -->
            <tr>
              <td style="padding:0 36px 32px;">
                <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#111;">What happens next:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${[
                    ['📞', 'We call you within 2 hours to confirm details'],
                    ['📋', 'You receive a detailed written estimate'],
                    ['✅', 'Approve online — no paperwork needed'],
                    ['🖌️', 'We paint. You love it. Or we fix it free.'],
                  ].map(([icon, text]) => `
                    <tr>
                      <td width="32" style="padding:6px 0;vertical-align:top;font-size:18px;">${icon}</td>
                      <td style="padding:6px 0;font-size:14px;color:#555;vertical-align:top;">${text}</td>
                    </tr>
                  `).join('')}
                </table>
              </td>
            </tr>

            <!-- Contact -->
            <tr>
              <td style="padding:0 36px 32px;">
                <div style="background:#f9f9f9;border-radius:10px;padding:18px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#888;">
                    Questions? Call or text us anytime:<br/>
                    <a href="tel:+19037148120" style="color:#F59E0B;font-weight:700;font-size:16px;text-decoration:none;">(903) 714-8120</a>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#0D0D0D;padding:20px 36px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#666;">
                  © 2026 DFW Pro Painters · Dallas–Fort Worth, TX<br/>
                  Powered by <a href="https://painterspro.app" style="color:#F59E0B;text-decoration:none;">PaintPro CRM</a>
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'DFW Pro Painters <hello@dfw-propainters.com>',
      to:      [to],
      subject: `Hi ${firstName}! We received your painting request 🖌️`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ─── Main Handler ──────────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotifyResult>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false, smsSent: false,
      emailSent: false, ownersSms: false,
      errors: ['Method not allowed'],
    });
  }

  const {
    firstName,
    phone,
    email,
    service,
    portalUrl,
    imageCount = 0,
  } = req.body as NotifyPayload;

  const errors: string[] = [];
  let smsSent   = false;
  let emailSent = false;
  let ownersSms = false;

  // ── 1. SMS to customer ───────────────────────────────────────
  if (phone) {
    try {
      const customerPhone = toE164(phone);
      const msg = `Hi ${firstName}! DFW Pro Painters received your request. Track your project here: ${portalUrl}\n\nQuestions? Call/text (903) 714-8120`;
      await sendSMS(customerPhone, msg);
      smsSent = true;
    } catch (e: any) {
      errors.push(`Customer SMS failed: ${e.message}`);
    }
  }

  // ── 2. SMS to both owners ────────────────────────────────────
  const ownerNumbers = [
    process.env.NOTIFY_OWNER_1,
    process.env.NOTIFY_OWNER_2,
  ].filter(Boolean) as string[];

  if (ownerNumbers.length > 0) {
    const ownerMsg = [
      `🔔 NEW LEAD — PaintPro CRM`,
      `Name: ${firstName}`,
      `Service: ${service || 'Not specified'}`,
      phone    ? `Phone: ${phone}` : null,
      email    ? `Email: ${email}` : null,
      imageCount > 0 ? `Photos: ${imageCount} attached` : null,
      `Portal: ${portalUrl}`,
    ].filter(Boolean).join('\n');

    const ownerResults = await Promise.allSettled(
      ownerNumbers.map(n => sendSMS(n, ownerMsg))
    );

    ownersSms = ownerResults.some(r => r.status === 'fulfilled');
    ownerResults.forEach((r, i) => {
      if (r.status === 'rejected') {
        errors.push(`Owner ${i + 1} SMS failed: ${r.reason?.message}`);
      }
    });
  }

  // ── 3. Email to customer ─────────────────────────────────────
  if (email) {
    try {
      await sendEmail(email, firstName, service ?? '', portalUrl, imageCount);
      emailSent = true;
    } catch (e: any) {
      errors.push(`Email failed: ${e.message}`);
    }
  }

  // ── 4. Respond ───────────────────────────────────────────────
  const success = smsSent || emailSent || ownersSms;

  return res.status(200).json({
    success,
    smsSent,
    emailSent,
    ownersSms,
    errors,
  });
}
