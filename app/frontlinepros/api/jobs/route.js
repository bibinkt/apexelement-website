// Owner actions on a job card: close it with an outcome, or leave a note.
// Scoped to the signed-in shop — a job id alone is never enough.

import { cookies } from 'next/headers';
import { shopForSession, COOKIE } from '../../../../lib/fp/auth';
import { selectOne, update } from '../../../../lib/fp/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OUTCOMES = ['booked', 'quoted', 'not_for_us', 'no_answer', 'duplicate', 'other'];

export async function POST(request) {
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  if (!shop) return Response.json({ ok: false, error: 'Please sign in.' }, { status: 401 });

  const { id, outcome, note, reopen } = await request.json().catch(() => ({}));
  if (!id) return Response.json({ ok: false, error: 'Which job?' }, { status: 400 });

  const card = await selectOne('fp_jobcards', `id=eq.${id}&shop_id=eq.${shop.id}`);
  if (!card) return Response.json({ ok: false, error: 'Not found.' }, { status: 404 });

  if (reopen) {
    await update('fp_jobcards', `id=eq.${card.id}`, { closed_at: null, outcome: null });
    return Response.json({ ok: true, closed: false });
  }

  if (outcome && !OUTCOMES.includes(outcome)) {
    return Response.json({ ok: false, error: 'Unknown outcome.' }, { status: 400 });
  }

  await update('fp_jobcards', `id=eq.${card.id}`, {
    closed_at: new Date().toISOString(),
    outcome: outcome || 'other',
    owner_note: typeof note === 'string' ? note.slice(0, 1000) : card.owner_note,
  });
  return Response.json({ ok: true, closed: true });
}
