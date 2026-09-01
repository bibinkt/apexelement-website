import { cookies } from 'next/headers';
import { shopForSession, COOKIE } from '../../../../../lib/fp/auth';
import { startCheckout, configured } from '../../../../../lib/fp/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  if (!shop) return Response.json({ ok: false, error: 'Please sign in first.' }, { status: 401 });
  if (!configured()) {
    return Response.json(
      { ok: false, error: 'Card payments are not switched on yet. We will be in touch to get you started.' },
      { status: 503 }
    );
  }
  try {
    const url = await startCheckout(shop);
    return Response.json({ ok: true, url });
  } catch (e) {
    console.error('[fp] checkout failed', e.message);
    return Response.json({ ok: false, error: 'Could not start checkout.' }, { status: 500 });
  }
}
