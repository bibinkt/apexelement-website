// Stripe webhook. Signature-verified with the same discipline as Twilio's:
// a forged event could mark any shop as paid.

import { verifyStripeSignature, applyEvent } from '../../../../../lib/fp/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const raw = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!(await verifyStripeSignature(raw, sig))) {
    return new Response('bad signature', { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  try {
    await applyEvent(event);
  } catch (e) {
    // Never 500 at Stripe — it retries, and a retry replays the event.
    console.error('[fp] stripe event failed', event?.type, e.message);
  }
  return Response.json({ received: true });
}
