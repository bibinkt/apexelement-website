'use client';

import { useState } from 'react';
import ArchFlow, { JourneyFlow } from './flow';

const TABS = [
  ['architecture', 'Architecture'],
  ['data', 'Data model'],
  ['tables', 'Tables & SQL'],
  ['journey', 'Session journey'],
];

const PRESETS = [
  ['Every shop', 'select business_name, trade_id, owner_phone, assigned_number, subscription_status, created_at from fp_shops order by created_at desc'],
  ['Conversations, newest first', 'select caller_phone, status, hazard, started_at, closed_at from fp_conversations order by started_at desc'],
  ['Blocked drafts', "select created_at, violation, left(body, 90) as draft from fp_messages where blocked = true order by created_at desc"],
  ['Cost per conversation', 'select conversation_id, count(*) as events, round(sum(usd)::numeric, 4) as usd from fp_costs group by 1 order by 3 desc'],
  ['Spend by link', 'select kind, model, count(*) as calls, round(sum(usd)::numeric, 4) as usd from fp_costs group by 1,2 order by 4 desc'],
  ['Open jobs', "select id, created_at, identified from fp_jobcards where closed_at is null order by created_at desc"],
  ['Opt-outs', 'select phone, shop_id, created_at from fp_optouts order by created_at desc'],
];

export default function TechConsole({ base = '', startShopId }) {
  const [tab, setTab] = useState(startShopId ? 'journey' : 'architecture');
  const [sql, setSql] = useState(PRESETS[0][1]);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [journey, setJourney] = useState(null);

  async function run(statement) {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${base}/api/admin/sql`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: statement ?? sql }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Query failed.');
      setRows(j.rows);
    } catch (e) { setErr(e.message); setRows(null); } finally { setBusy(false); }
  }

  async function lookup(payload) {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${base}/api/admin/journey`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Lookup failed.');
      setJourney(j);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  // Arriving from a shop row: load that shop's journey straight away.
  if (startShopId && journey === null && !busy && !err) lookup({ shopId: startShopId });

  const cols = rows && rows.length ? Object.keys(rows[0]) : [];

  return (
    <>
      <div className="techtabs">
        {TABS.map(([k, l]) => (
          <button key={k} className={`techtab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {(tab === 'architecture' || tab === 'data') && <ArchFlow view={tab} />}

      {tab === 'tables' && (
        <>
          <div className="presets">
            {PRESETS.map(([label, s]) => (
              <button key={label} className="preset" onClick={() => { setSql(s); run(s); }}>{label}</button>
            ))}
          </div>
          <textarea className="sqlbox" value={sql} onChange={(e) => setSql(e.target.value)}
                    spellCheck={false} rows={4} />
          <div className="closeact">
            <button className="btn" onClick={() => run()} disabled={busy}>{busy ? 'Running…' : 'Run'}</button>
            <span className="sqlnote">
              Read-only. SELECT and EXPLAIN over the fp_ tables, one statement, capped at 500 rows.
            </span>
          </div>
          {err && <div className="formmsg err">{err}</div>}
          {rows && (
            <>
              <p className="sqlcount">{rows.length} row{rows.length === 1 ? '' : 's'}</p>
              <div className="sqlwrap">
                <table className="sqltable">
                  <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        {cols.map((c) => (
                          <td key={c}>
                            {r[c] === null ? <span className="muted">null</span>
                              : typeof r[c] === 'object' ? JSON.stringify(r[c])
                              : String(r[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'journey' && (
        <>
          <div className="closeact" style={{ marginTop: 0, marginBottom: '14px' }}>
            <input className="wiz-input" style={{ maxWidth: '260px', margin: 0 }} value={q}
                   onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && lookup({ query: q })}
                   placeholder="Phone number — caller or owner" />
            <button className="btn" onClick={() => lookup({ query: q })} disabled={busy || !q}>
              {busy ? 'Looking…' : 'Trace'}
            </button>
          </div>
          {err && <div className="formmsg err">{err}</div>}
          <JourneyFlow data={journey} />
          {journey && !journey.empty && (
            <div className="dash-grid" style={{ marginTop: '18px' }}>
              <div className="panel">
                <h3>Rows found</h3>
                <ul className="equip">
                  <li><span>fp_conversations</span><b>{journey.conversations.length}</b></li>
                  <li><span>fp_messages</span><b>{journey.messages.length}</b></li>
                  <li><span>fp_jobcards</span><b>{journey.cards.length}</b></li>
                  <li><span>fp_costs</span><b>{journey.costs.length}</b></li>
                  <li><span>fp_optouts</span><b>{journey.optouts.length}</b></li>
                  <li><span>fp_sessions</span><b>{journey.sessions.length}</b></li>
                </ul>
              </div>
              <div className="panel">
                <h3>Transcript</h3>
                <div className="thread" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {journey.messages.slice(0, 40).map((m) => (
                    <div key={m.id} className={`bubble ${m.direction === 'in' ? 'them' : 'us'}`}>
                      {m.blocked && <span className="chip" style={{ marginRight: 6 }}>blocked · {m.violation}</span>}
                      {m.body}
                    </div>
                  ))}
                  {!journey.messages.length && <p className="panel-lead muted">No messages.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
