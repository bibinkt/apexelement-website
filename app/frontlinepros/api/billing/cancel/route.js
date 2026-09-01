import { cookies } from 'next/headers';
import { shopForSession, COOKIE } from '../../../../../lib/fp/auth';
import { cancelSubscription, resumeSubscription, portalUrl } from '../../../../../lib/fp/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  if (!shop) return Response.json({ ok: false, error: 'Please sign in first.' }, { status: 401 });

  const { action } = await request.json().catch(() => ({}));
  try {
    if (action === 'resume') return Response.json(await resumeSubscription(shop));
    if (action === 'portal') return Response.json({ ok: true, url: await portalUrl(shop) });
    return Response.json(await cancelSubscription(shop));
  } catch (e) {
    console.error('[fp] billing action failed', e.message);
    return Response.json({ ok: false, error: 'That did not go through.' }, { status: 500 });
  }
}
