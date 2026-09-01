// Everything we hold about one phone number or shop, across every table,
// shaped for the session-journey diagram.

import { cookies } from 'next/headers';
import { adminForSession, ADMIN_COOKIE } from '../../../../../lib/fp/admin';
import { select, selectOne } from '../../../../../lib/fp/db';
import { e164 } from '../../../../../lib/fp/twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!admin) return Response.json({ ok: false, error: 'Not signed in.' }, { status: 401 });

  const { query, shopId } = await request.json().catch(() => ({}));

  let shop = null;
  let conversations = [];

  if (shopId) {
    shop = await selectOne('fp_shops', `id=eq.${shopId}`);
  } else {
    const phone = e164(query);
    if (!phone) return Response.json({ ok: false, error: 'Give a phone number or a shop.' }, { status: 400 });
    // Could be the owner's number or a caller's.
    shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(phone)}`);
    conversations = await select(
      'fp_conversations',
      `caller_phone=eq.${encodeURIComponent(phone)}&order=started_at.desc`
    );
  }

  if (shop && !conversations.length) {
    conversations = await select('fp_conversations', `shop_id=eq.${shop.id}&order=started_at.desc`);
  }
  if (!shop && conversations.length) {
    shop = await selectOne('fp_shops', `id=eq.${conversations[0].shop_id}`);
  }
  if (!shop && !conversations.length) {
    return Response.json({ ok: true, empty: true });
  }

  const convIds = conversations.slice(0, 25).map((c) => c.id);
  const inList = convIds.map((i) => `"${i}"`).join(',');

  const [messages, cards, costs, optouts, sessions] = await Promise.all([
    convIds.length ? select('fp_messages', `conversation_id=in.(${inList})&order=created_at.asc`) : [],
    convIds.length ? select('fp_jobcards', `conversation_id=in.(${inList})`) : [],
    convIds.length ? select('fp_costs', `conversation_id=in.(${inList})`) : [],
    shop ? select('fp_optouts', `shop_id=eq.${shop.id}`) : [],
    shop ? select('fp_sessions', `shop_id=eq.${shop.id}`) : [],
  ]);

  return Response.json({
    ok: true,
    shop,
    conversations: conversations.slice(0, 25),
    messages,
    cards,
    costs,
    optouts,
    sessions: sessions.map((s) => ({ ...s, token: `${String(s.token).slice(0, 8)}…` })),
  });
}
