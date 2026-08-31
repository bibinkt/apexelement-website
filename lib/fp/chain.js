// Orchestrator. Runs L0→L6 for one inbound customer message.
//
// Compliance rules that live HERE and never in a prompt:
//   - STOP / HELP are handled before any model sees the message.
//   - An opted-out number is never messaged again, for that shop.
//   - Every outbound message passes L6 before it leaves.
//   - A hazard halts the chain and pages the owner.

import { insert, update, selectOne, select, meter, TELEPHONY_USD } from './db.js';
import { sendSms, fetchMedia, prettyPhone } from './twilio.js';
import { getTrade, escalationSms } from './trades.js';
import { l0Safety, l1Dialogue, l2Vision, l4Triage, l6Guard, FALLBACK_SMS } from './claude.js';
import { routeConfidence, assembleCard, ownerSms, isIdentified } from './jobcard.js';

const STOP_WORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'quit', 'end', 'optout', 'opt-out', 'revoke'];
const START_WORDS = ['start', 'unstop', 'yes'];
const HELP_WORDS = ['help', 'info'];

const MAX_RESHOOTS = 2;

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

export async function isOptedOut(shopId, phone) {
  const row = await selectOne('fp_optouts', `shop_id=eq.${shopId}&phone=eq.${encodeURIComponent(phone)}`);
  return !!row;
}

/** The opening text, fired straight after the missed call. Template, not a model. */
export async function sendOpeningSms(shop, callerPhone, callSid) {
  if (await isOptedOut(shop.id, callerPhone)) return { skipped: 'opted_out' };

  const conversation = await openConversation(shop, callerPhone, callSid);
  const text =
    `${shop.business_name}: sorry we missed your call, we're out on a job. ` +
    `What's giving you trouble, and what is it doing? Reply here and we'll get right back to you. ` +
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
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/fp_optouts?shop_id=eq.${shop.id}&phone=eq.${encodeURIComponent(from)}`, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }).catch(() => {});
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
    const { fields, needsReshoot } = routeConfidence(extract);
    state.fields = fields;
    state.media_url = mediaUrl;

    if (needsReshoot && conversation.reshoot_attempts < MAX_RESHOOTS) {
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
        verifiedFacts: fields,
      });
      return { action: 'reshoot' };
    }

    state.asset_capture = needsReshoot ? 'failed_after_retry' : 'captured';
    await update('fp_conversations', `id=eq.${conversation.id}`, { state });
    return finishOrAsk({ shop, trade, conversation, state, ctx });
  }

  // ── text turn ──
  if (!state.complaint) state.complaint = text;
  else if (state.question && !state.answer) state.answer = text;
  else if (!state.address && looksLikeAddress(text)) state.address = text;

  await update('fp_conversations', `id=eq.${conversation.id}`, { state });
  return finishOrAsk({ shop, trade, conversation, state, ctx });
}

function looksLikeAddress(t) {
  return /\d{1,6}\s+\w+/.test(t) && t.length > 8;
}

/** Decide whether we have enough to card, otherwise ask the next question. */
async function finishOrAsk({ shop, trade, conversation, state, ctx }) {
  const haveFields = !!state.fields;
  const captureDone = state.asset_capture === 'captured' || state.asset_capture === 'failed_after_retry' || state.asset_capture === 'declined';

  // Once we have the plate outcome, ask exactly one screening question.
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
      await update('fp_conversations', `id=eq.${conversation.id}`, { state });
      await guardedSend({
        shop,
        conversation,
        draft: `${shop.business_name}: ${q}`,
        verifiedFacts: state.fields,
        skipGuard: true, // the text is a verbatim string from the shop's own bank
      });
      return { action: 'triage' };
    }
  }

  // Enough to hand over: plate resolved and the screening question answered.
  if (captureDone && state.question && state.answer) {
    return closeWithCard({ shop, conversation, state });
  }

  // Otherwise let L1 drive the next question.
  const draft = await l1Dialogue({ shop, trade, state, body: state.complaint || '', ctx });
  if (draft.includes('[SILENT]')) return { action: 'silent' };
  await guardedSend({ shop, conversation, draft, verifiedFacts: state.fields });
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
