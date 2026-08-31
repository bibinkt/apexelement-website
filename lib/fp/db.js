// Thin PostgREST client against the shared A2Z Supabase project, service-role.
// No ORM and no SDK — fetch is enough and keeps the Vercel bundle small.
// Every table here is fp_*; RLS is on and only the service role can read them.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra = {}) {
  if (!URL || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function rest(path, init = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { ...init, cache: 'no-store' });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`supabase ${init.method || 'GET'} ${path} -> ${r.status} ${text.slice(0, 300)}`);
  }
  if (r.status === 204) return null;
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

export async function select(table, query = '') {
  return (await rest(`${table}${query ? `?${query}` : ''}`, { headers: headers() })) || [];
}

export async function selectOne(table, query) {
  const rows = await select(table, `${query}&limit=1`);
  return rows[0] || null;
}

export async function insert(table, row) {
  const rows = await rest(table, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(Array.isArray(row) ? row : [row]),
  });
  return Array.isArray(row) ? rows : rows?.[0] || null;
}

export async function update(table, query, patch) {
  const rows = await rest(`${table}?${query}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return rows?.[0] || null;
}

export async function upsert(table, row, onConflict) {
  const rows = await rest(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify([row]),
  });
  return rows?.[0] || null;
}

export async function remove(table, query) {
  await rest(`${table}?${query}`, { method: 'DELETE', headers: headers() });
}

// ── cost metering ────────────────────────────────────────────
// Written on every model call and every message. This is the data the
// pricing decision depends on, so it is captured from the first commit
// rather than reconstructed from a Twilio bill later.

// USD per million tokens.
const RATES = {
  'claude-sonnet-5': { in: 3.0, out: 15.0 },
  'claude-opus-5': { in: 5.0, out: 25.0 },
  'claude-haiku-4-5-20251001': { in: 1.0, out: 5.0 },
};

export function modelCost(model, inTok = 0, outTok = 0) {
  const r = RATES[model] || { in: 0, out: 0 };
  return (inTok / 1e6) * r.in + (outTok / 1e6) * r.out;
}

// Twilio list prices, US long code.
export const TELEPHONY_USD = {
  sms_out: 0.0079 + 0.003, // segment + carrier pass-through
  sms_in: 0.0075,
  mms_in: 0.01,
  voice: 0.0085, // ~1 min minimum on a short greeting
};

export async function meter(row) {
  try {
    await insert('fp_costs', row);
  } catch (e) {
    // Metering must never break a customer conversation.
    console.error('[fp] meter failed', e.message);
  }
}
