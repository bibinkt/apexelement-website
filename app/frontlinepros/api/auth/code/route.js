import { sendLoginCode } from '../../../../../lib/fp/auth';
import { e164 } from '../../../../../lib/fp/twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { phone } = await request.json().catch(() => ({}));
  const p = e164(phone);
  if (!p || p.length < 11) {
    return Response.json({ ok: false, error: 'Enter a valid mobile number.' }, { status: 400 });
  }
  const viaNumber = (process.env.FP_MARKETING_NUMBERS || '').split(',')[0]?.trim() || null;
  await sendLoginCode({ phone: p, viaNumber });
  // Same response whether or not the number is on file — no customer enumeration.
  return Response.json({ ok: true });
}
