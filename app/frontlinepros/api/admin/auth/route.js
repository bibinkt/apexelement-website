import { cookies } from 'next/headers';
import { sendAdminCode, verifyAdminCode, endAdminSession, ADMIN_COOKIE } from '../../../../../lib/fp/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { action, email, code } = await request.json().catch(() => ({}));

  if (action === 'code') {
    await sendAdminCode(email);
    // Same answer either way — this must not reveal who is an admin.
    return Response.json({ ok: true });
  }

  if (action === 'verify') {
    const r = await verifyAdminCode(email, code);
    if (!r.ok) return Response.json(r, { status: 401 });
    const res = Response.json({ ok: true, email: String(email).toLowerCase() });
    res.headers.append(
      'Set-Cookie',
      `${ADMIN_COOKIE}=${r.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${r.maxAge}`
    );
    return res;
  }

  if (action === 'logout') {
    await endAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    const res = Response.json({ ok: true });
    res.headers.append('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
    return res;
  }

  return Response.json({ ok: false, error: 'unknown action' }, { status: 400 });
}
