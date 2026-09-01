// The web form half of onboarding, for owners with no website or who'd rather type.

import { selectOne, insert, update } from '../../../../lib/fp/db';
import { e164, sendSms, lookupLineType } from '../../../../lib/fp/twilio';
import { sendLoginLink } from '../../../../lib/fp/auth';
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

  const clean = (v, max = 400) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

  const patch = {
    business_name: String(b.business_name).trim().slice(0, 120),
    trade_id: trade,
    owner_name: clean(b.owner_name, 80),
    owner_email: clean(b.owner_email, 160),
    website: clean(b.website, 200),
    service_area: clean(b.service_area, 200),
    address: clean(b.address, 200),
    hours: clean(b.hours, 80),
    days: clean(b.days, 60),
    emergency: b.emergency === true,
    notes: clean(b.notes, 1000),
    status: 'active',
    onboarding_step: 'done',
    activated_at: new Date().toISOString(),
  };

  const existing = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(phone)}`);

  // Ownership of the number is not proven by typing it into a form. Issuing a
  // session here meant anyone could POST a real shop's number and receive a
  // valid dashboard cookie for it — a complete account takeover. So: an
  // existing shop is never modified by this route, and nobody gets a session
  // until they follow the link we text to the number itself.
  if (existing) {
    await sendLoginLink({ shop: existing }).catch(() => {});
    return Response.json({
      ok: true,
      verify: 'sms',
      existing: true,
      message:
        'That number is already set up. We have texted a sign-in link to it.',
    });
  }

  const shop = await insert('fp_shops', { ...patch, owner_phone: phone });

  const from =
    shop.assigned_number || (process.env.FP_MARKETING_NUMBERS || '').split(',')[0]?.trim();
  if (from) {
    await sendSms(from, phone, await setupSms(shop)).catch(() => {});
  }
  await sendLoginLink({ shop }).catch(() => {});

  return Response.json({
    ok: true,
    verify: 'sms',
    business_name: shop.business_name,
    message: 'Setup done. We have texted you a link to your jobs.',
  });
}

/**
 * The forwarding code depends on the line type, and getting it wrong wastes
 * the owner's first five minutes. AT&T mobile needs the GSM string with a
 * 10-digit number and no country code; landlines take *71.
 */
async function setupSms(shop) {
  const num = (shop.assigned_number || '').replace(/^\+1/, '');
  if (!num) {
    return `FrontlinePros: you're set up. We'll assign your number and text you the forwarding code shortly.`;
  }
  let mobile = true;
  try {
    const r = await lookupLineType(shop.owner_phone);
    mobile = r !== 'landline';
  } catch {
    /* default to mobile — far more common for these shops */
  }
  return mobile
    ? `FrontlinePros: you're set up. On your business phone dial **61*${num}*11*10# to switch it on. ` +
      `Check it with *#61# and turn it off with ##61#.`
    : `FrontlinePros: you're set up. On your business line dial *71${num} to switch it on, and *73 to turn it off.`;
}
