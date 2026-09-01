// Handles the keypress from the consent gate on the marketing line.
//
// Nothing is texted unless the caller actively presses 1. That is a stronger
// position than texting someone to ask whether they want texts: an unwanted
// message is never sent at all.
//
// The keypress is logged with the call SID and timestamp as the consent record.
// It authorises the reply to their own enquiry; recurring marketing still needs
// the written consent checkbox on the contact page.

import { selectOne, insert, update } from '../../../../../lib/fp/db';
import { formParams, verifySignature, twiml, e164 } from '../../../../../lib/fp/twilio';
import { startOnboardingAfterConsent } from '../../../../../lib/fp/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const say = (t) =>
  twiml(`<Response><Say voice="Polly.Joanna">${t}</Say><Pause length="1"/><Hangup/></Response>`);

export async function POST(request) {
  const { params } = await formParams(request);
  const url = process.env.FP_CONSENT_URL || request.url;

  if (!verifySignature(url, params, request.headers.get('x-twilio-signature'))) {
    return new Response('forbidden', { status: 403 });
  }

  const to = e164(params.To);
  const from = e164(params.From);
  const digit = (params.Digits || '').trim();

  if (digit !== '1') {
    // No press, wrong key, or they hung up on the prompt — send nothing.
    return say(
      'No problem at all. Someone will call you back shortly. Thanks for calling FrontlinePros.'
    );
  }

  try {
    await startOnboardingAfterConsent({
      marketingNumber: to,
      from,
      callSid: params.CallSid || null,
    });
  } catch (e) {
    console.error('[fp] consent onboarding failed', e.message);
  }

  return say(
    'Great, the text is on its way. Reply to it and we will get you set up. ' +
    'Thanks for calling FrontlinePros.'
  );
}
