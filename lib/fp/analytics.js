// Dashboard analytics.
//
// The framing matters commercially: a shop owner does not care about "messages
// processed". He cares that calls he would have lost turned into jobs. So every
// number here is expressed as rescued work, and the headline is a funnel from
// missed call → replied → described → job card.

import { select } from './db';

const DAY = 864e5;

export async function loadShopData(shopId, days = 30) {
  const since = new Date(Date.now() - days * DAY).toISOString();
  const [conversations, cards, costs] = await Promise.all([
    select('fp_conversations', `shop_id=eq.${shopId}&started_at=gte.${since}&order=started_at.desc`),
    select('fp_jobcards', `shop_id=eq.${shopId}&created_at=gte.${since}&order=created_at.desc`),
    select('fp_costs', `shop_id=eq.${shopId}&created_at=gte.${since}`),
  ]);
  return { conversations, cards, costs, days };
}

export function summarise({ conversations, cards, costs, days }, { timezone = 'America/New_York' } = {}) {
  const total = conversations.length;
  const replied = conversations.filter((c) => c.first_reply_at).length;
  const engaged = conversations.filter(
    (c) => (c.state?.complaint || '').length > 0
  ).length;
  const carded = cards.length;
  const hazards = conversations.filter((c) => c.hazard).length;
  const stopped = conversations.filter((c) => c.status === 'stopped').length;
  const identified = cards.filter((c) => c.identified).length;

  // Median minutes from missed call to job card.
  const durations = [];
  for (const c of conversations) {
    if (c.status === 'carded' && c.closed_at) {
      durations.push((new Date(c.closed_at) - new Date(c.started_at)) / 60000);
    }
  }
  durations.sort((a, b) => a - b);
  const medianMinutes = durations.length
    ? Math.round(durations[Math.floor(durations.length / 2)])
    : null;

  // When the calls actually come in — tells the owner when to staff the phone.
  const byHour = Array.from({ length: 24 }, () => 0);
  const byDay = Array.from({ length: 7 }, () => 0);
  for (const c of conversations) {
    const d = new Date(new Date(c.started_at).toLocaleString('en-US', { timeZone: timezone }));
    byHour[d.getHours()] += 1;
    byDay[d.getDay()] += 1;
  }

  // Equipment mix, from verified plate reads only.
  const equipment = {};
  for (const card of cards) {
    const t = card.fields?.equipment_type?.value;
    if (t && t !== 'unknown') equipment[t] = (equipment[t] || 0) + 1;
  }
  const topEquipment = Object.entries(equipment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const spend = costs.reduce((s, r) => s + Number(r.usd || 0), 0);

  return {
    days,
    total,
    replied,
    engaged,
    carded,
    hazards,
    stopped,
    identified,
    identifyRate: carded ? Math.round((identified / carded) * 100) : 0,
    captureRate: total ? Math.round((carded / total) * 100) : 0,
    engageRate: total ? Math.round((engaged / total) * 100) : 0,
    medianMinutes,
    byHour,
    byDay,
    topEquipment,
    spend,
    costPerCard: carded ? spend / carded : 0,
    funnel: [
      { label: 'Calls we caught', value: total },
      { label: 'Texted back', value: replied },
      { label: 'Customer replied', value: engaged },
      { label: 'Job card sent', value: carded },
    ],
  };
}

/** Daily counts for the sparkline. */
export function dailySeries(conversations, cards, days = 30, timezone = 'America/New_York') {
  const key = (iso) =>
    new Date(new Date(iso).toLocaleString('en-US', { timeZone: timezone })).toISOString().slice(0, 10);

  const calls = {};
  const jobs = {};
  for (const c of conversations) calls[key(c.started_at)] = (calls[key(c.started_at)] || 0) + 1;
  for (const c of cards) jobs[key(c.created_at)] = (jobs[key(c.created_at)] || 0) + 1;

  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    out.push({ date: d, calls: calls[d] || 0, jobs: jobs[d] || 0 });
  }
  return out;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
