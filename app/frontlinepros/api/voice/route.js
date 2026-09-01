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

  // The marketing / onboarding line is not a shop, so it gets its own greeting.
  // It deliberately does NOT fire an SMS: the approved Marketing campaign
  // declares a single opt-in path (the consent checkbox), and texting someone
  // merely because they phoned us would fall outside it.
  const marketing = (process.env.FP_MARKETING_NUMBERS || '')
    .split(',').map((x) => x.trim()).filter(Boolean);
  if (marketing.includes(to)) {
    // Ask on the call itself whether they want a text. Nothing is sent unless
    // they press 1, so we never message someone who did not ask for it.
    if (process.env.FP_CALL_CONSENT === '1') {
      const action = `${process.env.FP_SITE_URL || 'https://frontlinepros.apexelement.ai'}/api/voice/consent`;
      return twiml(
        `<Response>` +
          `<Gather input="dtmf" numDigits="1" timeout="6" action="${action}" method="POST">` +
            `<Say voice="Polly.Joanna">Thanks for calling FrontlinePros. ` +
            `We can text you right now to get you set up. ` +
            `If you are happy for us to text this number, press one. ` +
            `Otherwise just hang up and someone will call you back.</Say>` +
          `</Gather>` +
          `<Say voice="Polly.Joanna">No problem. Someone will call you back shortly. Goodbye.</Say>` +
          `<Hangup/>` +
        `</Response>`
      );
    }
    return say(
      'Thanks for calling FrontlinePros. We answer our own phone, so leave it with us and ' +
      'someone will call you straight back. If you would rather see it working right now, ' +
      'visit frontline pros dot apex element dot A I. Thanks for calling.'
    );
  }

  const shop = await selectOne('fp_shops', `assigned_number=eq.${encodeURIComponent(to)}`);
  if (!shop) {
    console.error('[fp] voice: no shop for', to);
    return say('Sorry, this number is not in service right now. Goodbye.');
  }

  await meter({ shop_id: shop.id, kind: 'voice', usd: TELEPHONY_USD.voice });

  // Answer, name the business, promise the text, hang up. Three seconds so the
  // caller doesn't think they've been dumped.
  const greeting =
    `Hi, this is ${shop.business_name}. Sorry we could not pick up, the team is out on a job. ` +
    `We are sending you a text message right now, so you can tell us what you need. Thanks for calling.`;

  // Fire the SMS without blocking the TwiML response.
  sendOpeningSms(shop, from, params.CallSid).catch((e) =>
    console.error('[fp] opening sms failed', e.message)
  );

  return say(greeting);
}

export async function GET() {
  return new Response('FrontlinePros voice webhook', { status: 200 });
}
