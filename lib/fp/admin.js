// Admin auth. Allow-list of emails in fp_admins; a six-digit code is emailed
// via Resend. No passwords, same reasoning as the owner login — nothing to
// leak, nothing to reuse.
//
// Admin sessions are deliberately short (8h, vs 30 days for owners): this
// session can change pricing and switch off guard rails.

import crypto from 'crypto';
import { selectOne, insert, upsert, remove } from './db.js';

export const ADMIN_COOKIE = 'fp_admin';
const SESSION_HOURS = 8;
const CODE_TTL_MIN = 10;

export async function isAdminEmail(email) {
  if (!email) return false;
  const row = await selectOne('fp_admins', `email=eq.${encodeURIComponent(email.toLowerCase())}`);
  return !!row;
}

async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[fp] RESEND_API_KEY unset — cannot send admin code');
    return false;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FP_ADMIN_FROM || 'FrontlinePros <hello@apexelement.ai>',
      to: [to],
      subject,
      text,
    }),
  });
  if (!r.ok) {
    console.error('[fp] resend failed', r.status, (await r.text()).slice(0, 200));
    return false;
  }
  return true;
}

export async function sendAdminCode(email) {
  const e = String(email || '').trim().toLowerCase();
  // Always answer the same way, so this cannot be used to discover who is an admin.
  if (!(await isAdminEmail(e))) return { ok: true };

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await upsert(
    'fp_admin_codes',
    { email: e, code, attempts: 0, expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString() },
    'email'
  );
  await sendEmail(
    e,
    `FrontlinePros admin code: ${code}`,
    `Your FrontlinePros admin sign-in code is ${code}.\n\n` +
      `It expires in ${CODE_TTL_MIN} minutes and can be used once.\n\n` +
      `If you did not ask for this, someone has your email address but not your inbox — ` +
      `no action is needed, the code is useless without it.`
  );
  return { ok: true };
}

export async function verifyAdminCode(email, code) {
  const e = String(email || '').trim().toLowerCase();
  const row = await selectOne('fp_admin_codes', `email=eq.${encodeURIComponent(e)}`);
  if (!row) return { ok: false, error: 'Request a code first.' };
  if (new Date(row.expires_at) < new Date()) return { ok: false, error: 'That code has expired.' };
  if (row.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' };
  if (String(row.code) !== String(code).trim()) {
    await upsert('fp_admin_codes', { ...row, attempts: row.attempts + 1 }, 'email');
    return { ok: false, error: 'That code is not right.' };
  }

  await remove('fp_admin_codes', `email=eq.${encodeURIComponent(e)}`).catch(() => {});
  const token = crypto.randomBytes(32).toString('base64url');
  await insert('fp_admin_sessions', {
    token,
    email: e,
    expires_at: new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString(),
  });
  return { ok: true, token, maxAge: SESSION_HOURS * 3600 };
}

export async function adminForSession(token) {
  if (!token) return null;
  const row = await selectOne('fp_admin_sessions', `token=eq.${encodeURIComponent(token)}`);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await remove('fp_admin_sessions', `token=eq.${encodeURIComponent(token)}`).catch(() => {});
    return null;
  }
  // Revoking an admin should end their session, not wait for it to expire.
  if (!(await isAdminEmail(row.email))) return null;
  return { email: row.email, expiresAt: row.expires_at };
}

export async function endAdminSession(token) {
  if (token) await remove('fp_admin_sessions', `token=eq.${encodeURIComponent(token)}`).catch(() => {});
}
