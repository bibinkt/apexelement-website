// Thin PostgREST client against the shared A2Z Supabase project, service-role.
// No ORM and no SDK — fetch is enough and keeps the Vercel bundle small.
// Every table here is fp_*; RLS is on and only the service role can read them.


// ── in-memory mode ───────────────────────────────────────────
// Two ways in, both swapping Postgres for a Map so the whole chain can be
// exercised with no database, no Twilio and no A2P approval:
//
//   FP_TEST_DB=1        process-wide, for the offline CLI harness
//   sandbox.run(...)    request-scoped, for the hosted /test page
//
// The request-scoped form uses AsyncLocalStorage so concurrent requests on the
// same lambda cannot see each other's data. Production sets neither and talks
// to Postgres exactly as before.
import { AsyncLocalStorage } from 'node:async_hooks';

export const sandbox = new AsyncLocalStorage();

const envMem = new Map();
let envSeq = 1;

function ctx() {
  const s = sandbox.getStore();
  if (s) return s;
  if (process.env.FP_TEST_DB === '1') return { mem: envMem, seq: () => envSeq++ };
  return null;
}

export function newSandbox(tables = {}) {
  const mem = new Map(Object.entries(tables).map(([k, v]) => [k, [...v]]));
  let n = 1;
  return { mem, seq: () => n++, dump: () => Object.fromEntries(mem) };
}

const table = (t) => {
  const c = ctx();
  if (!c.mem.has(t)) c.mem.set(t, []);
  return c.mem.get(t);
};

export function _testReset() { envMem.clear(); envSeq = 1; }
export function _testTable(t) { return table(t); }

function parseQuery(q = '') {
  const filters = [];
  let order = null, desc = false, limit = null;
  for (const part of q.split('&').filter(Boolean)) {
    const [k, v] = part.split('=');
    if (k === 'order') { const [c, d] = decodeURIComponent(v).split('.'); order = c; desc = d === 'desc'; }
    else if (k === 'limit') limit = Number(v);
    else if (v?.startsWith('eq.')) filters.push([k, decodeURIComponent(v.slice(3))]);
    else if (v?.startsWith('gte.')) filters.push([k, decodeURIComponent(v.slice(4)), 'gte']);
    // PostgREST spells null and boolean tests with `is.`. Leaving it out did not
    // fail — it silently dropped the filter, so `shop_id=is.null` matched every
    // row and a test could pass while the code under it was wrong.
    else if (v?.startsWith('is.')) filters.push([k, decodeURIComponent(v.slice(3)), 'is']);
    // Anything unrecognised must be loud. A quietly ignored filter is how a
    // test proves something other than what it says it proves.
    else throw new Error(`test db: unsupported filter "${part}" — add it to parseQuery`);
  }
  return { filters, order, desc, limit };
}

function isMatch(actual, want) {
  if (want === 'null') return actual === null || actual === undefined;
  if (want === 'true') return actual === true;
  if (want === 'false') return actual === false;
  return String(actual) === want;
}

function memSelect(t, q) {
  const { filters, order, desc, limit } = parseQuery(q);
  let rows = table(t).filter((r) =>
    filters.every(([k, v, op]) =>
      op === 'gte' ? String(r[k]) >= v : op === 'is' ? isMatch(r[k], v) : String(r[k]) === v)
  );
  if (order) rows = [...rows].sort((a, b) =>
    desc ? String(b[order]).localeCompare(String(a[order])) : String(a[order]).localeCompare(String(b[order])));
  return limit ? rows.slice(0, limit) : rows;
}

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
  if (ctx()) return memSelect(table, query);
  return (await rest(`${table}${query ? `?${query}` : ''}`, { headers: headers() })) || [];
}

export async function selectOne(table, query) {
  const rows = await select(table, `${query}&limit=1`);
  return rows[0] || null;
}

export async function insert(tableName, row) {
  if (ctx()) {
    const rows = (Array.isArray(row) ? row : [row]).map((r) => ({
      id: r.id || `${tableName}-${ctx().seq()}`,
      created_at: r.created_at || new Date().toISOString(),
      started_at: r.started_at || new Date().toISOString(),
      ...r,
    }));
    _testTable(tableName).push(...rows);
    return Array.isArray(row) ? rows : rows[0];
  }
  const table = tableName;
  const rows = await rest(table, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(Array.isArray(row) ? row : [row]),
  });
  return Array.isArray(row) ? rows : rows?.[0] || null;
}

export async function update(tableName, query, patch) {
  if (ctx()) {
    const hits = memSelect(tableName, query);
    hits.forEach((r) => Object.assign(r, patch));
    return hits[0] || null;
  }
  const table = tableName;
  const rows = await rest(`${table}?${query}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  return rows?.[0] || null;
}

export async function upsert(tableName, row, onConflict) {
  if (ctx()) {
    const existing = _testTable(tableName).find((r) => r[onConflict] === row[onConflict]);
    if (existing) { Object.assign(existing, row); return existing; }
    return insert(tableName, row);
  }
  const table = tableName;
  const rows = await rest(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify([row]),
  });
  return rows?.[0] || null;
}

export async function remove(tableName, query) {
  if (ctx()) {
    const hits = new Set(memSelect(tableName, query));
    const t = _testTable(tableName);
    for (let i = t.length - 1; i >= 0; i--) if (hits.has(t[i])) t.splice(i, 1);
    return;
  }
  await rest(`${tableName}?${query}`, { method: 'DELETE', headers: headers() });
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
