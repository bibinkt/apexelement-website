// Profile completion. Deliberately not part of onboarding — a shop owner in a
// van will abandon a long form, so we ask for the minimum up front and collect
// the rest once they can see what it is for.

import { cookies } from 'next/headers';
import { shopForSession, COOKIE } from '../../../../lib/fp/auth';
import { update } from '../../../../lib/fp/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const clean = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(request) {
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  if (!shop) return Response.json({ ok: false, error: 'Please sign in.' }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const patch = {};
  if ('service_area' in b) patch.service_area = clean(b.service_area, 200);
  if ('address' in b) patch.address = clean(b.address, 200);
  if ('hours' in b) patch.hours = clean(b.hours, 80);
  if ('days' in b) patch.days = clean(b.days, 60);
  if ('owner_email' in b) patch.owner_email = clean(b.owner_email, 160);
  if ('owner_name' in b) patch.owner_name = clean(b.owner_name, 80);
  if ('notes' in b) patch.notes = clean(b.notes, 1000);
  if ('boundaries' in b) patch.boundaries = clean(b.boundaries, 1000);
  if ('brands_avoided' in b) patch.brands_avoided = clean(b.brands_avoided, 400);
  if ('emergency' in b) patch.emergency = b.emergency === true;
  if ('referrals_ok' in b) patch.referrals_ok = b.referrals_ok === true;

  if (!Object.keys(patch).length) {
    return Response.json({ ok: false, error: 'Nothing to save.' }, { status: 400 });
  }
  const saved = await update('fp_shops', `id=eq.${shop.id}`, patch);
  return Response.json({ ok: true, shop: saved });
}
