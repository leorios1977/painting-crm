// api/notify-lead.js
// CommonJS format — matches painting-crm api/ folder structure
// Sends SMS to customer + both owners, email to customer

/* global process */

// ── Phone normalizer ──────────────────────────────────────────
function toE164(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  return '+' + digits;
}

// ── Send SMS via Twilio ───────────────────────────────────────
async function sendSMS(to, body) {
  const sid    = process.env.TWILIO_ACCOUNT_SID;
  const key    = process.env.TWILIO_API_KEY;
  const secret = process.env.TWILIO_API_SECRET;
  const from   = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !key || !secret || !from) {
    throw new Error('Missing Twilio env vars: SID=' + sid + ' KEY=' + key + ' FROM=' + from);
  }

  const auth = Buffer.from(key + ':' + secret).toString('base64');
  const url  = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'To=' + encodeURIComponent(to) +
          '&From=' + encodeURIComponent(from) +
          '&Body=' + encodeURIComponent(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error('Twilio ' + res.status + ': ' + text);
  return JSON.parse(text);
}

// ── Send email via Resend ─────────────────────────────────────
async function sendEmail(to, firstName, service, portalUrl, imageCount) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY env var');

  const imageNote = imageCount > 0
    ? '<p style="color:#666;font-size:14px;">📎 You attached ' + imageCount + ' photo' + (imageCount > 1 ? 's' : '') + ' to your request.</p>'
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0D0D0D;padding:28px 36px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;">
              🖌️ <span style="color:#F59E0B;">DFW Pro</span> Painters
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 24px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;">Hi ${firstName}! We got your request. 👋</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
              Thanks for reaching out about your <strong>${service || 'painting'}</strong> project.
              We will review your details and call you within <strong>2 hours</strong>.
            </p>
            ${imageNote}
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 32px;">
            <div style="background:#FFFBF0;border:1.5px solid #F59E0B;border-radius:12px;padding:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#B45309;text-transform:uppercase;">Your Project Portal</p>
              <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">Track your quote, view photos, approve work, and pay your invoice — all in one place.</p>
              <a href="${portalUrl}" style="display:inline-block;background:#F59E0B;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                Track My Project →
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#999;">Bookmark this link — it's your personal project page</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 32px;">
            <div style="background:#f9f9f9;border-radius:10px;padding:18px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#888;">
                Questions? Call or text us anytime:<br/>
                <a href="tel:+14698344211" style="color:#F59E0B;font-weight:700;font-size:16px;text-decoration:none;">(469) 834-4211</a>
              </p>
            </div>
          </td>
        </tr>
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
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'DFW Pro Painters <hello@dfw-propainters.com>',
      to:      [to],
      subject: 'Hi ' + firstName + '! We received your painting request 🖌️',
      html,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error('Resend ' + res.status + ': ' + text);
  return JSON.parse(text);
}

// ── Main handler ──────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName    = 'there',
    phone        = null,
    email        = null,
    service      = null,
    portalUrl    = '',
    imageCount   = 0,
  } = req.body || {};

  const errors   = [];
  let smsSent    = false;
  let emailSent  = false;
  let ownersSms  = false;

  // 1. SMS to customer
  if (phone) {
    try {
      await sendSMS(toE164(phone),
        'Hi ' + firstName + '! DFW Pro Painters received your request. ' +
        'Track your project here: ' + portalUrl + '\n\n' +
        'Questions? Call/text (469) 834-4211'
      );
      smsSent = true;
    } catch (e) {
      errors.push('Customer SMS: ' + e.message);
    }
  }

  // 2. SMS to both owners
  const ownerNumbers = [
    process.env.NOTIFY_OWNER_1,
    process.env.NOTIFY_OWNER_2,
  ].filter(Boolean);

  if (ownerNumbers.length > 0) {
    const ownerMsg =
      '🔔 NEW LEAD — PaintPro CRM\n' +
      'Name: ' + firstName + '\n' +
      (service ? 'Service: ' + service + '\n' : '') +
      (phone   ? 'Phone: '   + phone   + '\n' : '') +
      (email   ? 'Email: '   + email   + '\n' : '') +
      (imageCount > 0 ? 'Photos: ' + imageCount + ' attached\n' : '') +
      'Portal: ' + portalUrl;

    const results = await Promise.allSettled(
      ownerNumbers.map(n => sendSMS(n, ownerMsg))
    );
    ownersSms = results.some(r => r.status === 'fulfilled');
    results.forEach((r, i) => {
      if (r.status === 'rejected') errors.push('Owner ' + (i+1) + ' SMS: ' + r.reason?.message);
    });
  }

  // 3. Email to customer
  if (email) {
    try {
      await sendEmail(email, firstName, service, portalUrl, imageCount);
      emailSent = true;
    } catch (e) {
      errors.push('Email: ' + e.message);
    }
  }

  return res.status(200).json({
    success: smsSent || emailSent || ownersSms,
    smsSent,
    emailSent,
    ownersSms,
    errors,
  });
};
