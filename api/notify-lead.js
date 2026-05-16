// api/notify-lead.js
// Uses Node.js built-in https — no fetch, works on ALL Node versions
// CommonJS format — matches api/package.json "type": "commonjs"

'use strict';

const https = require('https');

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const req  = https.request(
      { method: 'POST', hostname, path,
        headers: { ...headers, 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end',  ()  => resolve({ status: res.statusCode, body: raw }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function toE164(raw) {
  const d = String(raw).replace(/\D/g, '');
  if (d.startsWith('1') && d.length === 11) return '+' + d;
  if (d.length === 10) return '+1' + d;
  return '+' + d;
}

async function sendSMS(to, body) {
  const sid    = process.env.TWILIO_ACCOUNT_SID;
  const key    = process.env.TWILIO_API_KEY;
  const secret = process.env.TWILIO_API_SECRET;
  const from   = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !key || !secret || !from) {
    throw new Error('Missing Twilio vars SID:' + !!sid + ' KEY:' + !!key + ' FROM:' + !!from);
  }
  const auth    = Buffer.from(key + ':' + secret).toString('base64');
  const payload = 'To=' + encodeURIComponent(to) +
                  '&From=' + encodeURIComponent(from) +
                  '&Body=' + encodeURIComponent(body);
  const r = await httpPost(
    'api.twilio.com',
    '/2010-04-01/Accounts/' + sid + '/Messages.json',
    { 'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded' },
    payload
  );
  if (r.status >= 400) throw new Error('Twilio ' + r.status + ': ' + r.body);
  return r;
}

async function sendEmail(to, firstName, service, portalUrl, imageCount) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  const imgNote = imageCount > 0
    ? '<p style="font-size:14px;color:#666;">📎 ' + imageCount + ' photo(s) attached.</p>' : '';
  const html =
    '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:40px 20px;">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">' +
    '<div style="background:#0D0D0D;padding:28px;text-align:center;font-size:22px;font-weight:800;color:#fff;">' +
    '🖌️ <span style="color:#F59E0B;">DFW Pro</span> Painters</div>' +
    '<div style="padding:36px;">' +
    '<h1 style="color:#111;font-size:24px;">Hi ' + firstName + '! We got your request. 👋</h1>' +
    '<p style="color:#555;font-size:16px;line-height:1.6;">Thanks for reaching out about your <strong>' +
    (service || 'painting') + '</strong> project. We will call you within <strong>2 hours</strong>.</p>' +
    imgNote +
    '<div style="background:#FFFBF0;border:1.5px solid #F59E0B;border-radius:12px;padding:24px;text-align:center;margin-top:20px;">' +
    '<p style="color:#555;font-size:15px;">Track your quote and pay your invoice in one place.</p>' +
    '<a href="' + portalUrl + '" style="display:inline-block;background:#F59E0B;color:#000;font-weight:700;' +
    'font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Track My Project →</a></div>' +
    '<div style="margin-top:24px;background:#f9f9f9;border-radius:10px;padding:18px;text-align:center;">' +
    '<p style="color:#888;font-size:13px;">Questions? <a href="tel:+14698344211" style="color:#F59E0B;font-weight:700;">(469) 834-4211</a></p></div>' +
    '</div><div style="background:#0D0D0D;padding:20px;text-align:center;">' +
    '<p style="color:#666;font-size:12px;margin:0;">© 2026 DFW Pro Painters · Powered by ' +
    '<a href="https://paintersmax.app" style="color:#F59E0B;">PaintersMax</a></p></div></div></body></html>';
  const r = await httpPost(
    'api.resend.com', '/emails',
    { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    JSON.stringify({ from: 'DFW Pro Painters <hello@dfw-propainters.com>',
      to: [to], subject: 'Hi ' + firstName + '! We received your painting request 🖌️', html })
  );
  if (r.status >= 400) throw new Error('Resend ' + r.status + ': ' + r.body);
  return r;
}

module.exports = async function handler(req, res) {
  console.log('[notify-lead] ENV:', {
    SID: !!process.env.TWILIO_ACCOUNT_SID, KEY: !!process.env.TWILIO_API_KEY,
    SECRET: !!process.env.TWILIO_API_SECRET, FROM: !!process.env.TWILIO_PHONE_NUMBER,
    RESEND: !!process.env.RESEND_API_KEY,
    O1: !!process.env.NOTIFY_OWNER_1, O2: !!process.env.NOTIFY_OWNER_2,
  });
 res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { firstName='there', phone=null, email=null,
          service=null, portalUrl='', imageCount=0 } = req.body || {};
  const errors = []; let smsSent=false, emailSent=false, ownersSms=false;

  if (phone) {
    try { await sendSMS(toE164(String(phone)),
      'Hi ' + firstName + '! DFW Pro Painters received your request.\n' +
      'Track your project: ' + portalUrl + '\nQuestions? (469) 834-4211');
      smsSent = true; console.log('[notify-lead] Customer SMS ✓');
    } catch(e) { errors.push('CustomerSMS: '+e.message); console.error('[notify-lead]',e.message); }
  }

  const owners = [process.env.NOTIFY_OWNER_1, process.env.NOTIFY_OWNER_2].filter(Boolean);
  if (owners.length) {
    const msg = '🔔 NEW LEAD\nName: '+firstName+'\n'+(service?'Service: '+service+'\n':'')+
      (phone?'Phone: '+phone+'\n':'')+(email?'Email: '+email+'\n':'')+
      (imageCount>0?'Photos: '+imageCount+'\n':'')+'Portal: '+portalUrl;
    const rs = await Promise.allSettled(owners.map(n => sendSMS(n, msg)));
    ownersSms = rs.some(r=>r.status==='fulfilled');
    rs.forEach((r,i)=>{ if(r.status==='rejected') errors.push('Owner'+(i+1)+': '+r.reason?.message); });
  }

  if (email) {
    try { await sendEmail(email, firstName, service, portalUrl, imageCount);
      emailSent=true; console.log('[notify-lead] Email ✓');
    } catch(e) { errors.push('Email: '+e.message); console.error('[notify-lead]',e.message); }
  }

  console.log('[notify-lead] Result — SMS:'+smsSent+' Email:'+emailSent+' Owners:'+ownersSms);
  return res.status(200).json({ success: smsSent||emailSent||ownersSms, smsSent, emailSent, ownersSms, errors });
};
