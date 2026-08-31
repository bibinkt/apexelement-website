// Stateless simulator behind the /test page.
//
// The whole point: this runs the REAL production code — sendOpeningSms,
// handleInbound, handleOnboardingSms, the L0-L6 chain, the confidence router,
// the job card assembler. Nothing is stubbed except the two edges that need a
// phone company: the database is a per-request Map, and SMS is captured
// instead of sent. If it works here it works in production, because it IS
// production, minus telephony.
//
// State lives in the browser and is posted back each turn, so this endpoint
// holds nothing between calls and needs no database at all.

import { sandbox, newSandbox } from '../../../../../lib/fp/db';
import { sendOpeningSms, handleInbound } from '../../../../../lib/fp/chain';
import { handleOnboardingSms } from '../../../../../lib/fp/onboarding';
import { assembleCard } from '../../../../../lib/fp/jobcard';
import { selectOne } from '../../../../../lib/fp/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MARKETING = '+16802032310';
const SHOP_NUMBER = '+15735313742'; // stands in for the shop's assigned line

function friendlyError(e) {
  const msg = String(e?.message || e);
  if (/credit balance is too low/i.test(msg)) {
    return {
      kind: 'no_credit',
      message:
        'The Anthropic account is out of credit, so the language models cannot run. ' +
        'Everything that does not need a model (STOP, HELP, the opening text, hazard ' +
        'term matching) still works — top up the account to exercise the rest.',
    };
  }
  if (/ANTHROPIC_API_KEY/i.test(msg)) {
    return { kind: 'no_key', message: 'ANTHROPIC_API_KEY is not configured on the deployment.' };
  }
  return { kind: 'error', message: msg.slice(0, 400) };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action, tables = {}, text = '', photo = null, ownerPhone, callerPhone } = body;

  const box = newSandbox(tables);
  box.sent = [];

  let result = null;
  let error = null;

  try {
    await sandbox.run(box, async () => {
      switch (action) {
        // ── owner side ──────────────────────────────────────
        case 'owner_text': {
          result = await handleOnboardingSms({
            marketingNumber: MARKETING,
            from: ownerPhone,
            body: text,
          });
          break;
        }

        // ── customer side ───────────────────────────────────
        case 'missed_call': {
          const shop = await selectOne(
            'fp_shops',
            `assigned_number=eq.${encodeURIComponent(SHOP_NUMBER)}`
          );
          if (!shop) throw new Error('No shop has been set up yet — do the onboarding first.');
          result = await sendOpeningSms(shop, callerPhone, 'CAsimulated');
          break;
        }

        case 'customer_text': {
          const shop = await selectOne(
            'fp_shops',
            `assigned_number=eq.${encodeURIComponent(SHOP_NUMBER)}`
          );
          if (!shop) throw new Error('No shop has been set up yet — do the onboarding first.');
          result = await handleInbound({
            shop,
            from: callerPhone,
            body: text,
            mediaUrl: photo || null, // a data: URL goes through the real vision path
            mediaType: 'image/jpeg',
          });
          break;
        }

        // Give the shop its assigned number, the way provisioning will.
        case 'assign_number': {
          const shop = await selectOne(
            'fp_shops',
            `owner_phone=eq.${encodeURIComponent(ownerPhone)}`
          );
          if (!shop) throw new Error('No shop yet.');
          shop.assigned_number = SHOP_NUMBER;
          shop.status = 'active';
          result = { action: 'assigned', number: SHOP_NUMBER };
          break;
        }

        default:
          throw new Error(`unknown action: ${action}`);
      }
    });
  } catch (e) {
    console.error('[fp/test]', e.stack || e.message);
    error = friendlyError(e);
  }

  // A link that failed closed swallowed its own error; surface it so the page
  // can explain why everything suddenly looks like a hazard.
  if (!error && box.modelError) error = friendlyError(new Error(box.modelError.message));

  const dump = box.dump();

  // Render any job card produced this turn, exactly as L5 builds it.
  const cards = (dump.fp_jobcards || []).map((c) => {
    const conv = (dump.fp_conversations || []).find((x) => x.id === c.conversation_id);
    const shop = (dump.fp_shops || []).find((x) => x.id === c.shop_id);
    return {
      id: c.id,
      created_at: c.created_at,
      identified: c.identified,
      fields: c.fields,
      text:
        shop && conv
          ? assembleCard({
              shop,
              conversation: conv,
              fields: c.fields,
              complaint: conv.state?.complaint,
              question: conv.state?.question,
              answer: conv.state?.answer,
              mediaUrl: conv.state?.media_url ? '(photo attached)' : null,
              address: conv.state?.address,
            })
          : c.card_text,
    };
  });

  const spend = (dump.fp_costs || []).reduce((s, r) => s + Number(r.usd || 0), 0);

  return Response.json({
    ok: !error,
    error,
    result,
    tables: dump,
    sent: box.sent,
    cards,
    costs: { events: (dump.fp_costs || []).length, usd: spend },
  });
}

export async function GET() {
  return Response.json({ ok: true, note: 'FrontlinePros test simulator' });
}
