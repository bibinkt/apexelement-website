// One-tap login from the texted link: exchange the token for a cookie, then
// bounce to the dashboard so the token stops travelling in the URL.

import { shopForSession, COOKIE, cookieOptions } from '../../../../../lib/fp/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t');
  const shop = await shopForSession(t);

  const base = url.host.startsWith('frontlinepros.') ? '' : '/frontlinepros';
  const dest = new URL(`${base}/dashboard`, url.origin);

  if (!shop) {
    dest.searchParams.set('expired', '1');
    return Response.redirect(dest, 302);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      'Set-Cookie': `${COOKIE}=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieOptions.maxAge}`,
    },
  });
}
