// Read-only SQL for the admin console.
//
// This runs against the production database, behind a code emailed to an
// allow-listed address. That is a lot of power for one compromised inbox, so
// the guard is structural rather than advisory: a statement is rejected unless
// it is a single SELECT (or EXPLAIN / WITH … SELECT), and every query is
// wrapped so the transaction itself cannot write.
//
// Anything mutating is refused here outright. Schema changes go through a
// migration, where they are reviewed and reversible.

const FORBIDDEN = [
  'insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create', 'grant',
  'revoke', 'comment', 'copy', 'call', 'do', 'vacuum', 'reindex', 'cluster',
  'refresh', 'lock', 'listen', 'notify', 'set', 'reset', 'begin', 'commit',
  'rollback', 'savepoint', 'prepare', 'execute', 'deallocate', 'discard',
  'security', 'pg_read_file', 'pg_write', 'lo_import', 'lo_export', 'dblink',
  'pg_sleep', 'copy_from',
];

// Tables the console may read. Everything else, including other products'
// tables in the shared database, is out of scope.
const ALLOWED_TABLES = [
  'fp_shops', 'fp_conversations', 'fp_messages', 'fp_jobcards', 'fp_optouts',
  'fp_sessions', 'fp_login_codes', 'fp_costs', 'fp_admins', 'fp_admin_codes',
  'fp_admin_sessions', 'fp_settings',
];

export function inspect(sqlRaw) {
  const sql = String(sqlRaw || '').trim().replace(/;+\s*$/, '');
  if (!sql) return { ok: false, error: 'Nothing to run.' };

  // One statement only — a semicolon outside a string is a second statement.
  const withoutStrings = sql.replace(/'([^']|'')*'/g, "''").replace(/"[^"]*"/g, '""');
  if (withoutStrings.includes(';')) {
    return { ok: false, error: 'One statement at a time.' };
  }
  if (withoutStrings.includes('--') || withoutStrings.includes('/*')) {
    return { ok: false, error: 'Comments are not allowed — they are the usual way round a filter.' };
  }

  const lower = withoutStrings.toLowerCase();
  const first = lower.replace(/^\(+/, '').trimStart().split(/\s+/)[0];
  if (!['select', 'explain', 'with', 'table'].includes(first)) {
    return { ok: false, error: `Read-only console: ${first || 'that'} is not allowed. SELECT only.` };
  }
  // A CTE can still hide a write in Postgres (WITH x AS (DELETE …)).
  for (const word of FORBIDDEN) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return { ok: false, error: `Read-only console: "${word}" is not allowed.` };
    }
  }

  // Names introduced by a CTE are not tables — "with x as (…) select * from x"
  // must not be rejected for reading a table called x.
  const cteNames = [...lower.matchAll(/\b(?:with|,)\s+([a-z_][a-z0-9_]*)\s+as\s*\(/g)].map((m) => m[1]);
  // Aliases too: "from fp_shops s join … on s.id" — s is not a table.
  const aliases = [...lower.matchAll(/\b(?:from|join)\s+[a-z_][a-z0-9_.]*\s+(?:as\s+)?([a-z_][a-z0-9_]*)/g)]
    .map((m) => m[1])
    .filter((a) => !['on', 'where', 'group', 'order', 'limit', 'join', 'inner', 'left', 'right', 'full', 'cross', 'using'].includes(a));

  const known = new Set([...ALLOWED_TABLES, ...cteNames, ...aliases]);
  const referenced = [...lower.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_.]*)/g)].map((m) =>
    m[1].replace(/^public\./, '')
  );
  const outside = referenced.filter((t) => !known.has(t));
  if (outside.length) {
    return { ok: false, error: `Not a FrontlinePros table: ${outside.join(', ')}` };
  }

  // Hard row cap so a careless query cannot pull the whole database into a browser.
  const capped = /\blimit\s+\d+/i.test(lower) ? sql : `${sql} limit 500`;
  return { ok: true, sql: capped };
}

/**
 * Run it. READ ONLY is belt and braces on top of the parser: even if something
 * slipped through, the transaction refuses to write.
 */
export async function runQuery(sqlRaw) {
  const checked = inspect(sqlRaw);
  if (!checked.ok) return checked;

  const ref = (process.env.SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!ref || !token) {
    return { ok: false, error: 'SQL console is not configured (SUPABASE_ACCESS_TOKEN missing).' };
  }

  const wrapped = `set local statement_timeout = '8s'; ${checked.sql}`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Supabase sits behind Cloudflare, which rejects some default agents.
      'User-Agent': 'FrontlinePros-Admin/1.0',
    },
    body: JSON.stringify({ query: wrapped, read_only: true }),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 400);
    try { msg = JSON.parse(text).message || msg; } catch { /* keep raw */ }
    return { ok: false, error: msg };
  }
  try {
    const rows = JSON.parse(text);
    return { ok: true, rows: Array.isArray(rows) ? rows : [rows], sql: checked.sql };
  } catch {
    return { ok: false, error: 'Could not read the result.' };
  }
}

export const TABLES = ALLOWED_TABLES;
