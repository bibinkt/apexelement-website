// Twilio: signature validation and outbound SMS.
// Auth is a scoped API Key (SK…) + secret, with the account SID in the path.

import crypto from 'crypto';

const SID = process.env.TWILIO_API_KEY_SID;
const SECRET = process.env.TWILIO_API_KEY_SECRET;
const ACCOUNT = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN; // only used for signature checks

function basic() {
  return 'Basic ' + Buffer.from(`${SID}:${SECRET}`).toString('base64');
}

/**
 * Validate X-Twilio-Signature. Twilio signs with the ACCOUNT AUTH TOKEN, not the
 * API key secret — if the token isn't configured we fail closed in production
 * rather than silently accepting unsigned webhooks.
 */
export function verifySignature(url, params, signature) {
  if (!AUTH_TOKEN) {
    if (process.env.FP_ALLOW_UNSIGNED === '1') return true;
    console.error('[fp] TWILIO_AUTH_TOKEN unset — rejecting webhook');
    return false;
  }
  if (!signature) return false;
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join('');
  const expected = crypto.createHmac('sha1', AUTH_TOKEN).update(Buffer.from(data, 'utf-8')).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function sendSms(from, to, body) {
  const r = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: basic(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    }
  );
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    // 30034 = unregistered 10DLC. Expected until a campaign is approved.
    console.error('[fp] sendSms failed', r.status, j.code, j.message);
    return { ok: false, code: j.code, message: j.message };
  }
  return { ok: true, sid: j.sid };
}

// Fetch MMS media with API-key auth (media URLs are not public).
export async function fetchMedia(url) {
  const r = await fetch(url, { headers: { Authorization: basic() } });
  if (!r.ok) throw new Error(`media fetch ${r.status}`);
  const type = r.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await r.arrayBuffer());
  return { base64: buf.toString('base64'), type };
}

export function twiml(xml) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${xml}`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Twilio sends webhooks as form-encoded bodies.
export async function formParams(request) {
  const text = await request.text();
  const params = {};
  for (const [k, v] of new URLSearchParams(text)) params[k] = v;
  return { params, raw: text };
}

export function e164(input) {
  const digits = String(input || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

export function prettyPhone(e) {
  const d = String(e || '').replace(/\D/g, '').replace(/^1/, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e || '';
}
