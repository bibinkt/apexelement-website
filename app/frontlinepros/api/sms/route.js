// Twilio Messaging webhook. Every inbound SMS/MMS lands here.
//
// Two populations arrive on these numbers:
//   1. a homeowner replying to a missed-call text  → the chain
//   2. a business owner texting the marketing line → onboarding
// Which one it is depends on whether the number it landed on is a shop's
// assigned number or the marketing number.

import { selectOne } from '../../../../lib/fp/db';
import { formParams, verifySignature, twiml, e164 } from '../../../../lib/fp/twilio';
import { handleInbound } from '../../../../lib/fp/chain';
import { handleOnboardingSms } from '../../../../lib/fp/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EMPTY = () => twiml('<Response></Response>');

export async function POST(request) {
  const { params } = await formParams(request);
  const url = process.env.FP_SMS_URL || request.url;

  if (!verifySignature(url, params, request.headers.get('x-twilio-signature'))) {
    return new Response('forbidden', { status: 403 });
  }

  const to = e164(params.To);
  const from = e164(params.From);
  const body = params.Body || '';
  const mediaUrl = params.NumMedia && Number(params.NumMedia) > 0 ? params.MediaUrl0 : null;
  const mediaType = params.MediaContentType0 || 'image/jpeg';

  try {
    // Shop first, same as the voice route: an assigned number is that shop's
    // line. Onboarding only owns numbers no shop has been given.
    const shop = await selectOne('fp_shops', `assigned_number=eq.${encodeURIComponent(to)}`);

    if (!shop) {
      const marketing = (process.env.FP_MARKETING_NUMBERS || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      if (marketing.includes(to)) {
        await handleOnboardingSms({ marketingNumber: to, from, body });
        return EMPTY();
      }
      console.error('[fp] sms: no shop for', to);
      return EMPTY();
    }

    await handleInbound({ shop, from, body, mediaUrl, mediaType });
  } catch (e) {
    // Never 500 at Twilio — it retries, and a retry replays the whole turn.
    console.error('[fp] sms handler error', e.stack || e.message);
  }

  return EMPTY();
}

export async function GET() {
  return new Response('FrontlinePros messaging webhook', { status: 200 });
}
