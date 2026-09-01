// Runtime settings, editable from the admin view without a deploy.
//
// Anything an admin can change lives in fp_settings as one JSON row per key.
// Defaults here are the fallback, so a missing row is never a crash and a fresh
// database behaves exactly like the shipped product.

import { selectOne, upsert } from './db.js';

export const DEFAULTS = {
  pricing: {
    monthly_usd: 10,
    product_name: 'FrontlinePros',
    blurb: 'Everything included. No contract, cancel any time.',
  },
  guardrails: {
    // Freely editable — these are the shop's own words and safe to tune.
    hazard_extra: [],
    confidence_threshold: 0.8,
    max_reshoots: 2,
    max_turns: 6,
    abandon_hours: 12,
    // Protected — weakening these is what lets a customer be quoted a price or
    // given a diagnosis. Editable, but the UI makes you confirm what you are
    // switching off.
    forbid: {
      price: true,
      schedule: true,
      diagnosis: true,
      inventory: true,
      coverage: true,
      safety: true,
      identity: true,
      invention: true,
    },
  },
};

// Which guardrail keys are dangerous to relax. The admin UI reads this.
export const PROTECTED = {
  'forbid.price': 'The assistant could quote a price the shop then has to honour.',
  'forbid.schedule': 'The assistant could promise an arrival time nobody agreed to.',
  'forbid.diagnosis': 'The assistant could tell a customer what is wrong with their equipment.',
  'forbid.inventory': 'The assistant could claim a part is in stock.',
  'forbid.coverage': 'The assistant could claim work is under warranty or insured.',
  'forbid.safety': 'The assistant could tell someone to open, restart or operate equipment.',
  'forbid.identity': 'The assistant could deny being automated when asked directly.',
  'forbid.invention': 'The assistant could state equipment facts nobody verified.',
};

const cache = new Map();

export async function getSetting(key) {
  if (cache.has(key)) return cache.get(key);
  let value = DEFAULTS[key];
  try {
    const row = await selectOne('fp_settings', `key=eq.${encodeURIComponent(key)}`);
    if (row?.value) value = { ...DEFAULTS[key], ...row.value };
  } catch {
    /* a settings read must never take the product down */
  }
  cache.set(key, value);
  return value;
}

export async function setSetting(key, value) {
  const merged = { ...DEFAULTS[key], ...value };
  await upsert('fp_settings', { key, value: merged, updated_at: new Date().toISOString() }, 'key');
  cache.set(key, merged);
  return merged;
}

export function clearSettingsCache() {
  cache.clear();
}
