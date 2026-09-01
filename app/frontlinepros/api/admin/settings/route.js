import { cookies } from 'next/headers';
import { adminForSession, ADMIN_COOKIE } from '../../../../../lib/fp/admin';
import { getSetting, setSetting, PROTECTED } from '../../../../../lib/fp/settings';
import { insert } from '../../../../../lib/fp/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!admin) return Response.json({ ok: false, error: 'Not signed in.' }, { status: 401 });

  const { key, value, confirm } = await request.json().catch(() => ({}));
  if (!['pricing', 'guardrails'].includes(key)) {
    return Response.json({ ok: false, error: 'unknown setting' }, { status: 400 });
  }

  // Turning a prohibition off is the one change that can put words in front of
  // a customer that we promised would never be there. It needs the explicit
  // confirmation flag, and it gets written to the audit trail either way.
  if (key === 'guardrails') {
    const current = await getSetting('guardrails');
    const weakened = Object.keys(PROTECTED).filter((path) => {
      const f = path.split('.')[1];
      return current.forbid?.[f] === true && value?.forbid?.[f] === false;
    });
    if (weakened.length && confirm !== true) {
      return Response.json(
        {
          ok: false,
          needsConfirm: true,
          weakened,
          reasons: weakened.map((w) => PROTECTED[w]),
        },
        { status: 409 }
      );
    }
    if (weakened.length) {
      await insert('fp_costs', {
        kind: 'audit_guardrail_off',
        model: admin.email,
        usd: 0,
      }).catch(() => {});
      console.warn('[fp] guardrail disabled by', admin.email, weakened.join(','));
    }
  }

  const saved = await setSetting(key, value);
  return Response.json({ ok: true, value: saved });
}

export async function GET() {
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!admin) return Response.json({ ok: false }, { status: 401 });
  return Response.json({
    ok: true,
    pricing: await getSetting('pricing'),
    guardrails: await getSetting('guardrails'),
    protected: PROTECTED,
  });
}
