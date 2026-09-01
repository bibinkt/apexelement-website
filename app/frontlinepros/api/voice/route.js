// Twilio Voice webhook. The shop's carrier forwards an unanswered call here.
//
// We identify the shop from the number the call LANDED on (To), because a
// forwarded call carries the caller's number, not the shop's. Twilio's
// ForwardedFrom is carrier-dependent and frequently empty on US PSTN, so it is
// never load-bearing here.

import { selectOne, meter, TELEPHONY_USD } from '../../../../lib/fp/db';
import { formParams, verifySignature, twiml, e164 } from '../../../../lib/fp/twilio';
import { sendOpeningSms } from '../../../../lib/fp/chain';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function say(text) {
  return twiml(
    `<Response><Say voice="Polly.Joanna">${text}</Say><Pause length="1"/><Hangup/></Response>`
  );
}

export async function POST(request) {
  const { params } = await formParams(request);
  const url = process.env.FP_VOICE_URL || request.url;

  if (!verifySignature(url, params, request.headers.get('x-twilio-signature'))) {
    return new Response('forbidden', { status: 403 });
  }

  const to = e164(params.To);
  const from = e164(params.From);

  // A number assigned to a shop behaves as that shop's line, always. The
  // marketing greeting is only what an unassigned number falls back to.
  const shop = await selectOne('fp_shops', `assigned_number=eq.${encodeURIComponent(to)}`);

  if (!shop) {
    const marketing = (process.env.FP_MARKETING_NUMBERS || '')
      .split(',').map((x) => x.trim()).filter(Boolean);
    if (marketing.includes(to)) {
      return say(
        'Thanks for calling FrontlinePros. We answer our own phone, so leave it with us and ' +
        'someone will call you straight back. If you would rather see it working right now, ' +
        'visit frontline pros dot apex element dot A I. Thanks for calling.'
      );
    }
    console.error('[fp] voice: no shop for', to);
    return say('Sorry, this number is not in service right now. Goodbye.');
  }

  await meter({ shop_id: shop.id, kind: 'voice', usd: TELEPHONY_USD.voice });

  // Answer, name the business, promise the text, hang up. Three seconds so the
  // caller doesn't think they've been dumped.
  const greeting =
    `Hi, this is ${shop.business_name}. Sorry we could not get to the phone — ` +
    `the team is out on a job right now. ` +
    `We are texting you this second, so just tell us what is going wrong and we will take it ` +
    `from there. Speak soon.`;

  // Await it. Fire-and-forget looks tempting here, but this runs on serverless:
  // the moment we return the TwiML the function is torn down and an in-flight
  // promise is killed, so the caller hears the greeting and never gets a text.
  // The send is one API call and the greeting takes several seconds to speak,
  // so the caller notices nothing.
  try {
    await sendOpeningSms(shop, from, params.CallSid);
  } catch (e) {
    console.error('[fp] opening sms failed', e.message);
  }

  return say(greeting);
}

export async function GET() {
  return new Response('FrontlinePros voice webhook', { status: 200 });
}
