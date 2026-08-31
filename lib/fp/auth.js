// Owner auth. The login identity is the owner's phone number — no passwords.
// Two routes in, both ending at the same session cookie:
//   1. Text the FrontlinePros number  → we text back a one-tap session link
//   2. Enter your number on the site  → we text a 6-digit code
//
// A shop's phone number is proven by the fact that the SMS reached it.

import crypto from 'crypto';
import { selectOne, insert, upsert, remove } from './db';
import { sendSms } from './twilio';

const SESSION_DAYS = 30;
const CODE_TTL_MIN = 10;
export const COOKIE = 'fp_session';

function siteUrl() {
  return process.env.FP_SITE_URL || 'https://frontlinepros.apexelement.ai';
}

function token() {
  return crypto.randomBytes(32).toString('base64url');
}

export async function createSession(shopId) {
  const t = token();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await insert('fp_sessions', { token: t, shop_id: shopId, expires_at: expires });
  return { token: t, expires };
}

export async function shopForSession(t) {
  if (!t) return null;
  const row = await selectOne('fp_sessions', `token=eq.${encodeURIComponent(t)}`);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await remove('fp_sessions', `token=eq.${encodeURIComponent(t)}`).catch(() => {});
    return null;
  }
  return selectOne('fp_shops', `id=eq.${row.shop_id}`);
}

/** One-tap login link, texted to the owner. */
export async function sendLoginLink({ shop, viaNumber }) {
  const { token: t } = await createSession(shop.id);
  const from = viaNumber || shop.assigned_number;
  if (!from) return { ok: false, reason: 'no_sending_number' };
  await sendSms(
    from,
    shop.owner_phone,
    `FrontlinePros: here's your dashboard — the link works for 30 days on this phone.\n${siteUrl()}/api/auth/link?t=${t}`
  );
  return { ok: true };
}

/** 6-digit code, for someone logging in from a laptop. */
export async function sendLoginCode({ phone, viaNumber }) {
  const shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(phone)}`);
  // Always report the same thing, so this can't be used to enumerate customers.
  if (!shop) return { ok: true };

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await upsert(
    'fp_login_codes',
    {
      phone,
      code,
      attempts: 0,
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
    },
    'phone'
  );

  const from = viaNumber || shop.assigned_number || (process.env.FP_MARKETING_NUMBERS || '').split(',')[0];
  if (from) {
    await sendSms(from, phone, `FrontlinePros: your login code is ${code}. It expires in ${CODE_TTL_MIN} minutes.`);
  }
  return { ok: true };
}

export async function verifyLoginCode({ phone, code }) {
  const row = await selectOne('fp_login_codes', `phone=eq.${encodeURIComponent(phone)}`);
  if (!row) return { ok: false, error: 'No code requested for that number.' };
  if (new Date(row.expires_at) < new Date()) return { ok: false, error: 'That code has expired.' };
  if (row.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' };

  if (String(row.code) !== String(code).trim()) {
    await upsert('fp_login_codes', { ...row, attempts: row.attempts + 1 }, 'phone');
    return { ok: false, error: 'That code is not right.' };
  }

  const shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(phone)}`);
  if (!shop) return { ok: false, error: 'No account for that number.' };

  await remove('fp_login_codes', `phone=eq.${encodeURIComponent(phone)}`).catch(() => {});
  const session = await createSession(shop.id);
  return { ok: true, ...session, shop };
}

export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_DAYS * 86400,
};
