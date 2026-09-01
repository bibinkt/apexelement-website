// Out-of-trade calls, and the introduction to another shop.
//
// Arun's case: someone rang an appliance shop about a thermostat, and we went
// on asking for a data plate that a thermostat does not have. This catches it
// on the first message instead of six turns later.
//
// On the referral itself we deliberately make an INTRODUCTION, not a
// recommendation. We never tell a consumer "use Bob's HVAC". We ask whether
// they would like their details passed on, and only then does the other shop
// get a job card. Recommending a third party to a consumer carries real
// liability when that third party does bad work; passing on a request the
// customer asked us to pass on does not.

import { select, insert, update } from './db.js';
import { getTrade, TRADES } from './trades.js';
import { getSetting } from './settings.js';
import { confirmOutOfTrade } from './claude.js';

// Deterministic first pass. Free, and it decides the common case on its own.
const TRADE_HINTS = {
  hvac: ['thermostat', 'a/c', 'ac', 'ac unit', 'air con', 'aircon', 'air conditioner',
         'air conditioning', 'furnace', 'heat pump', 'heating', 'cooling', 'hvac',
         'condenser', 'air handler', 'ductwork', 'mini split', 'mini-split',
         'evaporator', 'refrigerant', 'freon'],
  plumbing: ['toilet', 'faucet', 'drain', 'sewer', 'sump pump', 'septic',
             'garbage disposal', 'water pressure', 'burst pipe', 'shower',
             'clogged', 'blocked drain', 'main line'],
  appliance: ['fridge', 'refrigerator', 'freezer', 'washer', 'washing machine',
              'dryer', 'dishwasher', 'oven', 'stove', 'range', 'microwave',
              'ice maker', 'cooktop'],
};

const lower = (t) => String(t || '').toLowerCase();

// Whole words only. Substring matching quietly finds "range" inside
// "arrangement" and "ac" inside "back", and every one of those is a customer
// wrongly told their job is not this shop's work.
const wordCache = new Map();
function mentions(text, phrase) {
  let re = wordCache.get(phrase);
  if (!re) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i');
    wordCache.set(phrase, re);
  }
  return re.test(text);
}

/** The equipment this shop's own trade profile says it handles. */
function ownVocabulary(tradeId) {
  const types = (TRADES[tradeId]?.equipment_types || []).map((t) => t.replace(/_/g, ' '));
  return [...(TRADE_HINTS[tradeId] || []), ...types].filter((w) => w !== 'unknown');
}

/**
 * Which trade does this complaint sound like? null when it is unclear, so an
 * ambiguous message never triggers a referral by accident.
 */
export function guessTrade(text) {
  const t = lower(text);
  const hits = Object.entries(TRADE_HINTS)
    .map(([trade, words]) => [trade, words.filter((w) => mentions(t, w)).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!hits.length) return null;
  // Two trades matched equally well — too ambiguous to act on.
  if (hits.length > 1 && hits[0][1] === hits[1][1]) return null;
  return hits[0][0];
}

/**
 * Deterministic scope check. Returns the trade this belongs to, or null for
 * "keep it". The shop's OWN vocabulary is checked first: an HVAC shop hearing
 * "water heater" is in scope, even though the word is in the plumbing list.
 */
export function looksOutOfTrade(shop, complaint) {
  const t = lower(complaint);
  if (!t) return null;
  if (ownVocabulary(shop.trade_id).some((w) => mentions(t, w))) return null;
  const guessed = guessTrade(t);
  if (!guessed || guessed === shop.trade_id) return null;
  return guessed;
}

/**
 * The full check. The cheap pass decides almost everything; only when it says
 * "not ours" do we spend one haiku call, which also gets to read the owner's
 * own boundaries text ("we don't touch commercial", "no Sub-Zero"). The model
 * can only VETO a referral, never create one — and any error means no referral,
 * because a wrong referral is worse than a missed one.
 */
export async function outOfTradeCheck({ shop, complaint, ctx }) {
  const suspected = looksOutOfTrade(shop, complaint);
  if (!suspected) return null;

  const trade = getTrade(shop.trade_id);
  const verdict = await confirmOutOfTrade({
    complaint,
    shopName: shop.business_name,
    tradeLabel: trade.trade_label,
    equipmentTypes: (trade.equipment_types || []).filter((t) => t !== 'unknown'),
    boundaries: shop.boundaries,
    suspected,
    ctx,
  });
  if (!verdict || verdict.in_scope !== false) return null;
  return { trade: suspected, reason: verdict.reason || null };
}

/**
 * Shops that could take this: right trade, agreed to be introduced, live and
 * paying. Never the shop the customer already rang.
 */
export async function candidates(neededTrade, excludeShopId) {
  const rows = await select(
    'fp_shops',
    `trade_id=eq.${encodeURIComponent(neededTrade)}&referrals_ok=is.true&status=eq.active&limit=10`
  ).catch(() => []);
  return rows.filter(
    (s) =>
      s.id !== excludeShopId &&
      s.assigned_number &&
      ['active', 'trialing', 'cancelling'].includes(s.subscription_status)
  );
}

/** Offering to pass their details on. Never names the other shop. */
export function offerText(shop, neededTrade) {
  const label = TRADES[neededTrade]?.trade_label || neededTrade;
  const mine = getTrade(shop.trade_id).trade_label;
  return (
    `${shop.business_name}: that sounds like ${label} rather than ${mine}, so it isn't work we take on. ` +
    `We do know a ${label} company who covers this area — would you like us to pass on your number and ` +
    `what you've told us, so they can call you? Reply YES and we will. Reply STOP to opt out.`
  );
}

/** Nobody to introduce them to. Say so plainly rather than pretending. */
export function noMatchText(shop, neededTrade) {
  const label = TRADES[neededTrade]?.trade_label || neededTrade;
  const mine = getTrade(shop.trade_id).trade_label;
  return (
    `${shop.business_name}: sorry — we only do ${mine}, so this one is outside what we can help with. ` +
    `You'll want a ${label} company for it. Reply STOP to opt out.`
  );
}

export function declinedText(shop) {
  return (
    `${shop.business_name}: no problem at all. We haven't passed your details to anyone. ` +
    `Give us a shout if you ever need us. Reply STOP to opt out.`
  );
}

export function introducedText(shop) {
  return (
    `${shop.business_name}: done — we've passed your number and what you told us to them, and they'll ` +
    `be in touch. Reply STOP to opt out.`
  );
}

/**
 * The customer said yes. Create a job card on the other shop's account and text
 * their owner. The consumer's details move only because the consumer asked.
 */
export async function introduce({ fromShop, toShop, conversation, state }) {
  const lines = [
    `INTRODUCTION — passed on by ${fromShop.business_name}`,
    '─────────────────────────────────',
    `CUSTOMER    ${conversation.caller_phone}`,
    `THEY SAID   "${state.complaint || 'not given'}"`,
  ];
  if (state.duration) lines.push(`HOW LONG    ${state.duration}`);
  if (state.address) lines.push(`ADDRESS     ${state.address}   [customer-stated]`);
  if (state.availability) lines.push(`FREE        ${state.availability}`);
  lines.push(
    '',
    `This customer rang ${fromShop.business_name}, who don't cover this work.`,
    'They agreed to have their details passed to you.',
    '⚠ NOT DIAGNOSED. Nothing here is verified beyond what the customer said.',
    '─────────────────────────────────'
  );

  const card = await insert('fp_jobcards', {
    conversation_id: conversation.id,
    shop_id: toShop.id,
    identified: false,
    fields: state.fields || {},
    card_text: lines.join('\n'),
    delivered_at: new Date().toISOString(),
  });

  await update('fp_conversations', `id=eq.${conversation.id}`, {
    status: 'referred',
    closed_at: new Date().toISOString(),
    state: { ...state, referred_to: toShop.id, referred_card: card?.id || null },
  });
  return card;
}

export async function referralsEnabled() {
  const rails = await getSetting('guardrails');
  return rails?.referrals_enabled === true;
}
