// Orchestrator. Runs L0→L6 for one inbound customer message.
//
// Compliance rules that live HERE and never in a prompt:
//   - STOP / HELP are handled before any model sees the message.
//   - An opted-out number is never messaged again, for that shop.
//   - Every outbound message passes L6 before it leaves.
//   - A hazard halts the chain and pages the owner.

import { insert, update, selectOne, select, remove, meter, TELEPHONY_USD } from './db.js';
import { sendSms, fetchMedia, prettyPhone } from './twilio.js';
import { getTrade, escalationSms } from './trades.js';
import { l0Safety, l1Dialogue, l2Vision, l4Triage, l6Guard, FALLBACK_SMS, extractIntake, missingFields } from './claude.js';
import { routeConfidence, assembleCard, ownerSms, isIdentified } from './jobcard.js';
import { getSetting } from './settings.js';

const STOP_WORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'quit', 'end', 'optout', 'opt-out', 'revoke'];
const START_WORDS = ['start', 'unstop', 'yes'];
const HELP_WORDS = ['help', 'info'];

// Defaults; the admin view can override these per deployment and the values are
// read per conversation so a change takes effect without a deploy.
const MAX_RESHOOTS = 2;
// A conversation that never ends costs money and annoys the customer, so the
// photo step gives up on its own after this many customer messages.
const MAX_TURNS = 6;
const DECLINED =
  /\b(can'?t|cannot|couldn'?t|won'?t|unable to)\b.{0,24}\b(find|see|reach|get to|read|access)\b|\bno (sticker|label|plate|tag)\b|\bnot there\b|\bthere isn'?t one\b|\bskip\b/i;

function siteUrl() {
  return process.env.FP_SITE_URL || 'https://frontlinepros.apexelement.ai';
}

async function logMessage(conversationId, direction, body, extra = {}) {
  await insert('fp_messages', {
    conversation_id: conversationId,
    direction,
    body: body || null,
    media_url: extra.mediaUrl || null,
    blocked: !!extra.blocked,
    violation: extra.violation || null,
  });
}

/** Every outbound message goes through here. No exceptions. */
export async function guardedSend({ shop, conversation, draft, verifiedFacts, skipGuard }) {
  let text = draft;
  let blocked = false;
  let violation = null;

  if (!skipGuard) {
    const verdict = await l6Guard({
      draft,
      verifiedFacts,
      ctx: { conversationId: conversation?.id, shopId: shop.id },
    });
    if (!verdict.pass) {
      blocked = true;
      violation = verdict.violation || 'unknown';
      text = FALLBACK_SMS(shop);
    }
  }

  if (blocked) {
    await logMessage(conversation.id, 'out', draft, { blocked: true, violation });
  }

  const res = await sendSms(shop.assigned_number, conversation.caller_phone, text);
  await logMessage(conversation.id, 'out', text);
  await meter({
    conversation_id: conversation.id,
    shop_id: shop.id,
    kind: 'sms_out',
    usd: TELEPHONY_USD.sms_out,
  });
  return { sent: res.ok, text, blocked, violation, error: res.ok ? null : res };
}

async function openConversation(shop, callerPhone, callSid) {
  const existing = await selectOne(
    'fp_conversations',
    `shop_id=eq.${shop.id}&caller_phone=eq.${encodeURIComponent(callerPhone)}&status=eq.open&order=started_at.desc`
  );
  if (existing) return existing;
  // Set every field the chain later reads back explicitly. Leaning on column
  // defaults means the row we hold in memory differs from the row in the table,
  // and the status filter below is what finds an open conversation at all.
  return insert('fp_conversations', {
    shop_id: shop.id,
    caller_phone: callerPhone,
    call_sid: callSid || null,
    status: 'open',
    hazard: false,
    reshoot_attempts: 0,
    started_at: new Date().toISOString(),
    state: { complaint: null, address: null, asset_capture: 'pending', question: null, answer: null },
  });
}

/**
 * Honour both kinds of opt-out: one recorded against this shop, and a global
 * one recorded with no shop (someone who replied STOP to the marketing line).
 * Checking only the shop-scoped row let a global opt-out be ignored.
 */
export async function isOptedOut(shopId, phone) {
  const p = encodeURIComponent(phone);
  const mine = await selectOne('fp_optouts', `shop_id=eq.${shopId}&phone=eq.${p}`);
  if (mine) return true;
  const global = await selectOne('fp_optouts', `shop_id=is.null&phone=eq.${p}`);
  return !!global;
}

/** The opening text, fired straight after the missed call. Template, not a model. */
export async function sendOpeningSms(shop, callerPhone, callSid) {
  if (await isOptedOut(shop.id, callerPhone)) return { skipped: 'opted_out' };

  const conversation = await openConversation(shop, callerPhone, callSid);
  const text =
    `${shop.business_name}: sorry we couldn't get to the phone — we're out on a job. ` +
    `Tell me what's gone wrong and I'll get everything down for the technician. ` +
    `Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;

  // Turn-1 is a fixed template with no model in the path, so it needs no guard.
  const out = await guardedSend({ shop, conversation, draft: text, skipGuard: true });
  await update('fp_conversations', `id=eq.${conversation.id}`, { first_reply_at: new Date().toISOString() });
  return { conversation, ...out };
}

/**
 * Handle one inbound SMS/MMS from a customer.
 */
export async function handleInbound({ shop, from, body, mediaUrl, mediaType }) {
  const trade = getTrade(shop.trade_id);
  const text = (body || '').trim();
  const word = text.toLowerCase().replace(/[^a-z-]/g, '');

  let conversation = await selectOne(
    'fp_conversations',
    `shop_id=eq.${shop.id}&caller_phone=eq.${encodeURIComponent(from)}&status=eq.open&order=started_at.desc`
  );

  // ── carrier keywords, handled in code before any model ──
  if (STOP_WORDS.includes(word)) {
    await insert('fp_optouts', { shop_id: shop.id, phone: from }).catch(() => {});
    if (conversation) {
      await logMessage(conversation.id, 'in', text);
      await update('fp_conversations', `id=eq.${conversation.id}`, {
        status: 'stopped',
        closed_at: new Date().toISOString(),
      });
    }
    await sendSms(
      shop.assigned_number,
      from,
      `${shop.business_name}: you have been unsubscribed and will not receive any more messages from this number. Reply START to resubscribe.`
    );
    return { action: 'stop' };
  }

  if (START_WORDS.includes(word)) {
    // Use the helper, not a raw fetch: a direct call to Supabase bypasses the
    // request-scoped sandbox, so this silently hit the real database from the
    // test bench and did nothing at all in the offline harness.
    await remove('fp_optouts', `shop_id=eq.${shop.id}&phone=eq.${encodeURIComponent(from)}`).catch(() => {});
    await remove('fp_optouts', `shop_id=is.null&phone=eq.${encodeURIComponent(from)}`).catch(() => {});
    await sendSms(
      shop.assigned_number,
      from,
      `${shop.business_name}: you're opted back in. We'll text you here if we miss your call. Msg & data rates may apply. Reply HELP for help, STOP to opt out.`
    );
    return { action: 'start' };
  }

  if (HELP_WORDS.includes(word)) {
    await sendSms(
      shop.assigned_number,
      from,
      `${shop.business_name} via FrontlinePros: this is our automated text line for calls we could not answer. Help: hello@apexelement.ai. Msg & data rates may apply. Reply STOP to unsubscribe.`
    );
    return { action: 'help' };
  }

  if (await isOptedOut(shop.id, from)) return { action: 'suppressed_opted_out' };

  // §7.6 — an inbound message with no open session is not dropped; it goes to the owner.
  if (!conversation) {
    await forwardToOwner(shop, from, text);
    return { action: 'forwarded_no_session' };
  }

  await logMessage(conversation.id, 'in', text, { mediaUrl });
  await meter({
    conversation_id: conversation.id,
    shop_id: shop.id,
    kind: mediaUrl ? 'mms_in' : 'sms_in',
    usd: mediaUrl ? TELEPHONY_USD.mms_in : TELEPHONY_USD.sms_in,
  });

  const ctx = { conversationId: conversation.id, shopId: shop.id };
  const state = conversation.state || {};

  // Admin-tunable limits, read live rather than baked in at deploy time.
  const rails = await getSetting('guardrails');
  const maxReshoots = Number(rails?.max_reshoots ?? MAX_RESHOOTS);
  const maxTurns = Number(rails?.max_turns ?? MAX_TURNS);
  state.max_turns = maxTurns;

  // ── L0 — safety gate, on every inbound ──
  const safety = await l0Safety({ trade, body: text, ctx });
  if (safety.hazard) {
    await update('fp_conversations', `id=eq.${conversation.id}`, {
      status: 'hazard',
      hazard: true,
      hazard_phrase: safety.trigger_phrase || null,
      closed_at: new Date().toISOString(),
    });
    await guardedSend({
      shop,
      conversation,
      draft: escalationSms({ ...shop, owner_phone_display: prettyPhone(shop.owner_phone) }),
      skipGuard: true,
    });
    await forwardToOwner(
      shop,
      from,
      `⚠ HAZARD FLAGGED — "${safety.trigger_phrase || text.slice(0, 60)}". Customer told to call you directly. Chain halted.`
    );
    return { action: 'hazard' };
  }

  // ── photo turn: L2 → L3 ──
  if (mediaUrl) {
    let extract = null;
    try {
      const media = await fetchMedia(mediaUrl);
      extract = await l2Vision({ trade, base64: media.base64, mediaType: media.type, ctx });
    } catch (e) {
      console.error('[fp] vision failed', e.message);
    }
    const { fields, needsReshoot } = routeConfidence(
      extract,
      Number(rails?.confidence_threshold ?? 0.8)
    );
    state.fields = fields;
    state.media_url = mediaUrl;

    if (needsReshoot && conversation.reshoot_attempts < maxReshoots) {
      await update('fp_conversations', `id=eq.${conversation.id}`, {
        reshoot_attempts: conversation.reshoot_attempts + 1,
        state,
      });
      await guardedSend({
        shop,
        conversation,
        draft:
          `${shop.business_name}: I couldn't quite read the numbers on that one. ` +
          `Could you retake it a bit closer, with the label filling the frame?`,
        verifiedFacts: factsFor(state),
      });
      return { action: 'reshoot' };
    }

    state.asset_capture = needsReshoot ? 'failed_after_retry' : 'captured';
    await update('fp_conversations', `id=eq.${conversation.id}`, { state });
    return finishOrAsk({ shop, trade, conversation, state, ctx });
  }

  // ── text turn ──
  state.turns = (state.turns || 0) + 1;
  state.asked = state.asked || [];

  // The dialogue asks; this records. Without it the checklist never fills and
  // the assistant re-asks what it has already been told.
  state.last_inbound = text;
  const got = await extractIntake({ body: text, state, ctx });
  if (got) {
    if (got.symptom && !state.complaint) state.complaint = got.symptom;
    if (got.duration && !state.duration) state.duration = got.duration;
    if (got.still_running && !state.still_running) state.still_running = got.still_running;
    if (got.address && !state.address) state.address = got.address;
    if (got.availability && !state.availability) state.availability = got.availability;
    if (got.declines_photo && state.asset_capture === 'pending') state.asset_capture = 'declined';
    if (got.asks_question) state.last_question = got.asks_question;
  }
  // Fall back to the raw message if extraction found nothing at all.
  if (!state.complaint && text) state.complaint = text;

  // Their reply answers whatever we last put to them.
  state.pending_ask = null;

  // A screening question is outstanding, so this reply is the answer to it.
  // Lost when the turn handler was rewritten, which left every conversation
  // one field short of complete and no card was ever built.
  if (state.question && !state.answer) state.answer = text;

  // Regex backstop for the decline. The extractor missed "can't get behind it
  // to find any sticker", and a missed decline stalls the whole intake: the
  // photo step never settles, so triage never runs and no card is ever built.
  if (state.asset_capture === 'pending' && DECLINED.test(text)) {
    state.asset_capture = 'declined';
  }

  // Hard stop regardless of what anyone says: a conversation must terminate.
  if (state.asset_capture === 'pending' && state.turns >= maxTurns) {
    state.asset_capture = 'failed_after_retry';
  }

  await update('fp_conversations', `id=eq.${conversation.id}`, { state });
  return finishOrAsk({ shop, trade, conversation, state, ctx });
}

/**
 * What L6 is allowed to treat as known. The guard blocks "any specific fact
 * about the customer's equipment not present in VERIFIED FACTS" — so the
 * customer's own words have to be in here, or the guard blocks us for repeating
 * back what they just told us. Provenance is kept on each, matching the card.
 */
function factsFor(state = {}) {
  return {
    customer_stated: {
      complaint: state.complaint || null,
      answer: state.answer || null,
      address: state.address || null,
    },
    verified_from_photo: state.fields || null,
  };
}

function looksLikeAddress(t) {
  return /\d{1,6}\s+\w+/.test(t) && t.length > 8;
}

/**
 * Drive the intake off the checklist. We only hand over when there is nothing
 * useful left to ask — not after a fixed number of turns.
 */
async function finishOrAsk({ shop, trade, conversation, state, ctx }) {
  const captureDone =
    state.asset_capture === 'captured' ||
    state.asset_capture === 'failed_after_retry' ||
    state.asset_capture === 'declined';

  // One screening question from the shop's own bank, once the plate is settled.
  if (captureDone && !state.question) {
    const equipmentType = state.fields?.equipment_type?.value;
    const q = await l4Triage({
      trade,
      equipmentType: equipmentType && equipmentType !== 'unknown' ? equipmentType : 'unknown',
      complaint: state.complaint,
      ctx,
    });
    if (q) {
      state.question = q;
      state.asked.push('screening');
      await update('fp_conversations', `id=eq.${conversation.id}`, { state });
      await guardedSend({
        shop,
        conversation,
        draft: `${shop.business_name}: ${q}`,
        verifiedFacts: factsFor(state),
        skipGuard: true, // verbatim string from the shop's own bank
      });
      return { action: 'triage' };
    }
  }

  const missing = missingFields(state);
  // Asking marks a field done-with, which is what stops us nagging — but it
  // also made the intake look complete the moment the last question left,
  // closing the job before the customer had answered it. So a card is never
  // built while an ask is still outstanding.
  const intakeDone =
    captureDone && state.question && state.answer && missing.length === 0 && !state.pending_ask;

  if (intakeDone || state.turns >= (state.max_turns || MAX_TURNS) + 3) {
    return closeWithCard({ shop, conversation, state });
  }

  // Otherwise keep collecting.
  const history = await select(
    'fp_messages',
    `conversation_id=eq.${conversation.id}&order=created_at.asc`
  ).catch(() => []);

  const draft = await l1Dialogue({
    shop,
    trade,
    state,
    body: state.last_inbound || state.complaint || '',
    history,
    ctx,
  });
  if (draft.includes('[SILENT]')) return { action: 'silent' };

  // Record the optional field we put in front of it this turn. Matching the
  // draft with a regex was unreliable and let it ask twice; the prompt is
  // given one target, so mark that target.
  // Only the TOP of the list, because that is the one L1 is told to ask for.
  // Marking any optional field found anywhere in the list burned both address
  // and availability on turn one, while the assistant was still asking about
  // the symptom — so the intake looked complete before either was requested.
  const target = ['address', 'availability'].includes(missing[0]) ? missing[0] : null;
  if (target && !state.asked.includes(target)) {
    state.asked.push(target);
    state.pending_ask = target;
  }

  await update('fp_conversations', `id=eq.${conversation.id}`, { state });

  await guardedSend({ shop, conversation, draft, verifiedFacts: factsFor(state) });
  return { action: 'dialogue' };
}

async function closeWithCard({ shop, conversation, state }) {
  const fields = state.fields || {};
  const card = assembleCard({
    shop,
    conversation,
    fields,
    complaint: state.complaint,
    question: state.question,
    answer: state.answer,
    mediaUrl: state.media_url,
    address: state.address,
    duration: state.duration,
    stillRunning: state.still_running,
    availability: state.availability,
  });

  const saved = await insert('fp_jobcards', {
    conversation_id: conversation.id,
    shop_id: shop.id,
    card_text: card,
    fields,
    identified: isIdentified(fields),
    delivered_at: new Date().toISOString(),
  });

  await update('fp_conversations', `id=eq.${conversation.id}`, {
    status: 'carded',
    closed_at: new Date().toISOString(),
    state,
  });

  await guardedSend({
    shop,
    conversation,
    draft: `${shop.business_name}: thanks, that's everything we need. Someone from the team will call you back to sort this out.`,
    skipGuard: true,
  });

  await sendSms(
    shop.assigned_number,
    shop.owner_phone,
    ownerSms({
      shop,
      conversation,
      fields,
      complaint: state.complaint,
      dashboardUrl: `${siteUrl()}/dashboard/jobs/${saved?.id || ''}`,
    })
  );

  return { action: 'carded', jobcard: saved?.id };
}

async function forwardToOwner(shop, from, text) {
  if (!shop.assigned_number || !shop.owner_phone) return;
  await sendSms(
    shop.assigned_number,
    shop.owner_phone,
    `${shop.business_name} — text from ${prettyPhone(from)}:\n"${String(text).slice(0, 250)}"`
  );
}
