// The web form half of onboarding, for owners with no website or who'd rather type.

import { selectOne, insert, update } from '../../../../lib/fp/db';
import { e164, prettyPhone, sendSms } from '../../../../lib/fp/twilio';
import { createSession, COOKIE, cookieOptions } from '../../../../lib/fp/auth';
import { TRADES } from '../../../../lib/fp/trades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const phone = e164(b.phone);

  if (!phone || phone.length < 11) {
    return Response.json({ ok: false, error: 'Enter a valid mobile number.' }, { status: 400 });
  }
  if (!b.business_name || String(b.business_name).trim().length < 2) {
    return Response.json({ ok: false, error: 'Enter your business name.' }, { status: 400 });
  }
  const trade = TRADES[b.trade_id] ? b.trade_id : 'appliance';

  const patch = {
    business_name: String(b.business_name).trim(),
    trade_id: trade,
    owner_name: b.owner_name?.trim() || null,
    owner_email: b.owner_email?.trim() || null,
    website: b.website?.trim() || null,
    service_area: b.service_area?.trim() || null,
    address: b.address?.trim() || null,
    status: 'active',
    onboarding_step: 'done',
    activated_at: new Date().toISOString(),
  };

  let shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(phone)}`);
  shop = shop
    ? await update('fp_shops', `id=eq.${shop.id}`, patch)
    : await insert('fp_shops', { ...patch, owner_phone: phone });

  const from =
    shop.assigned_number || (process.env.FP_MARKETING_NUMBERS || '').split(',')[0]?.trim();
  if (from) {
    await sendSms(
      from,
      phone,
      shop.assigned_number
        ? `FrontlinePros: you're set up. Your number is ${prettyPhone(shop.assigned_number)}. ` +
            `Dial *71${shop.assigned_number.replace('+1', '')} on your business line to switch it on, *73 to turn it off.`
        : `FrontlinePros: you're set up. We'll assign your number and text you the forwarding code shortly.`
    ).catch(() => {});
  }

  const session = await createSession(shop.id);
  const res = Response.json({ ok: true, business_name: shop.business_name });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE}=${session.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${cookieOptions.maxAge}`
  );
  return res;
}
