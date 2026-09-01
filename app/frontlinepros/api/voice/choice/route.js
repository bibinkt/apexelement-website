// The caller chose demo or setup on the demo line.
//   1 (or no input) → the Ace Appliance experience, exactly as a real customer gets it
//   2              → shop onboarding

import { selectOne } from '../../../../../lib/fp/db';
import { formParams, verifySignature, twiml, e164 } from '../../../../../lib/fp/twilio';
import { sendOpeningSms } from '../../../../../lib/fp/chain';
import { startOnboardingAfterConsent } from '../../../../../lib/fp/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const say = (t) =>
  twiml(`<Response><Say voice="Polly.Joanna">${t}</Say><Pause length="1"/><Hangup/></Response>`);

export async function POST(request) {
  const { params } = await formParams(request);
  const url = new URL(request.url);

  // No bypass. Twilio signs the full URL including any query string, so a
  // <Redirect> carrying ?Digits=1 verifies like anything else. An earlier
  // version skipped the check whenever Digits was present in the query, which
  // let anyone trigger an SMS to a number of their choosing.
  if (!verifySignature(request.url, params, request.headers.get('x-twilio-signature'))) {
    return new Response('forbidden', { status: 403 });
  }

  const to = e164(params.To);
  const from = e164(params.From);
  const digit = (params.Digits || url.searchParams.get('Digits') || '1').trim();

  const shop = await selectOne('fp_shops', `assigned_number=eq.${encodeURIComponent(to)}`);
  if (!shop) return say('Sorry, this number is not in service right now. Goodbye.');

  if (digit === '2') {
    try {
      await startOnboardingAfterConsent({ marketingNumber: to, from, callSid: params.CallSid });
    } catch (e) {
      console.error('[fp] setup start failed', e.message);
    }
    return say(
      'Great. We have just texted you to get started — it takes about a minute, ' +
      'and most of it we fill in for you. Thanks for calling FrontlinePros.'
    );
  }

  // Default: the demo. Identical to what a real customer receives.
  try {
    await sendOpeningSms(shop, from, params.CallSid);
  } catch (e) {
    console.error('[fp] demo sms failed', e.message);
  }
  return say(
    `Hi, this is ${shop.business_name}. Sorry we could not get to the phone — ` +
    'the team is out on a job right now. We are texting you this second, so just tell us ' +
    'what is going wrong and we will take it from there. Speak soon.'
  );
}
