import { verifyLoginCode, COOKIE, cookieOptions } from '../../../../../lib/fp/auth';
import { e164 } from '../../../../../lib/fp/twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { phone, code } = await request.json().catch(() => ({}));
  const result = await verifyLoginCode({ phone: e164(phone), code });
  if (!result.ok) return Response.json(result, { status: 401 });

  const res = Response.json({ ok: true, business_name: result.shop.business_name });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE}=${result.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieOptions.maxAge}`
  );
  return res;
}
