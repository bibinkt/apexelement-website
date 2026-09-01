'use client';

import { useState } from 'react';

const OUTCOMES = [
  ['booked', 'Booked it'],
  ['quoted', 'Quoted, waiting'],
  ['not_for_us', 'Not for us'],
  ['no_answer', 'Couldn’t reach them'],
  ['duplicate', 'Duplicate'],
  ['other', 'Other'],
];

export function CloseJob({ base = '', id, closed, outcome, note }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!closed);
  const [pickedOutcome, setPicked] = useState(outcome || '');
  const [text, setText] = useState(note || '');
  const [error, setError] = useState(null);

  async function post(body) {
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${base}/api/jobs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'That did not save.');
      setDone(j.closed); setOpen(false);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="jobclose done">
        <span className="chip ok">
          Closed{pickedOutcome ? ` · ${OUTCOMES.find((o) => o[0] === pickedOutcome)?.[1] || pickedOutcome}` : ''}
        </span>
        <button className="linkbtn" disabled={busy} onClick={() => post({ reopen: true })}>Reopen</button>
      </div>
    );
  }

  return (
    <div className="jobclose">
      {!open ? (
        <button className="btn" onClick={() => setOpen(true)}>Mark this job closed</button>
      ) : (
        <div className="closebox">
          <b>How did it end?</b>
          <div className="outcomes">
            {OUTCOMES.map(([v, l]) => (
              <button key={v} type="button"
                className={`outcome${pickedOutcome === v ? ' on' : ''}`}
                onClick={() => setPicked(v)}>{l}</button>
            ))}
          </div>
          <label className="wiz-label" htmlFor={`n-${id}`}>Note for yourself (optional)</label>
          <textarea id={`n-${id}`} className="wiz-input wiz-area" value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Anything worth remembering next time." />
          <div className="closeact">
            <button className="btn" disabled={busy || !pickedOutcome}
                    onClick={() => post({ outcome: pickedOutcome, note: text })}>
              {busy ? 'Saving…' : 'Close job'}
            </button>
            <button className="linkbtn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {error && <div className="formmsg err">{error}</div>}
    </div>
  );
}

export function ProfileNudge({ base = '', shop, fields, pct, done, total }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, shop[f.key] || '']))
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (pct === 100 && !open) return null;

  async function save() {
    setBusy(true);
    try {
      const r = await fetch(`${base}/api/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vals),
      });
      if ((await r.json()).ok) { setSaved(true); setTimeout(() => window.location.reload(), 700); }
    } finally { setBusy(false); }
  }

  return (
    <div className="profile">
      <div className="profile-head">
        <b>{saved ? 'Saved.' : 'Your assistant could do more with a bit more'}</b>
        <span className="profile-pct">{done} of {total}</span>
      </div>
      <div className="profile-bar"><div className="profile-fill" style={{ width: `${pct}%` }} /></div>
      {!open ? (
        <>
          <p className="panel-lead" style={{ margin: '0 0 12px', fontSize: '14px' }}>
            None of this is required. Each one just makes it screen better for you.
          </p>
          <div className="profile-miss">
            {fields.slice(0, 4).map((f) => (
              <a key={f.key} href="#" onClick={(e) => { e.preventDefault(); setOpen(true); }}>{f.label}</a>
            ))}
            {fields.length > 4 && (
              <a href="#" onClick={(e) => { e.preventDefault(); setOpen(true); }}>
                +{fields.length - 4} more
              </a>
            )}
          </div>
        </>
      ) : (
        <>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="wiz-label" htmlFor={`p-${f.key}`}>{f.label}</label>
              <p className="profile-why">{f.why}</p>
              {['boundaries', 'notes'].includes(f.key) ? (
                <textarea id={`p-${f.key}`} className="wiz-input wiz-area" value={vals[f.key]}
                          onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              ) : (
                <input id={`p-${f.key}`} className="wiz-input" value={vals[f.key]}
                       onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="closeact">
            <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="linkbtn" onClick={() => setOpen(false)}>Later</button>
          </div>
        </>
      )}
    </div>
  );
}

export function SubscriptionBar({ base = '', status, endsAt, billingOn }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const state = status || 'none';
  const cls = ['active', 'trialing'].includes(state) ? 'on'
            : ['cancelling', 'past_due'].includes(state) ? 'warn' : 'off';

  async function act(action) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`${base}/api/billing/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      if (!j.ok) throw new Error(j.error || 'That did not go through.');
      window.location.reload();
    } catch (e) { setMsg(e.message); setBusy(false); }
  }

  return (
    <div className="subbar">
      <div>
        <b>
          {state === 'active' ? 'Your line is live'
            : state === 'cancelling' ? 'Cancelling at the end of the period'
            : state === 'past_due' ? 'Payment failed'
            : 'No subscription yet'}
        </b>
        <span>
          {endsAt ? `Runs until ${new Date(endsAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}. ` : ''}
          {state === 'none' && 'Start any time — cancel from here whenever you like.'}
          {state === 'past_due' && 'Update your card to keep the line answering.'}
        </span>
      </div>
      <div className="subact">
        <span className={`sub-pill ${cls}`}>{state}</span>
        {state === 'none' && <a className="btn" href={`${base}/subscribe`}>Subscribe</a>}
        {state === 'cancelling' && (
          <button className="btn" disabled={busy} onClick={() => act('resume')}>Keep it on</button>
        )}
        {['active', 'past_due'].includes(state) && billingOn && (
          <>
            <button className="btn btn-ghost" disabled={busy} onClick={() => act('portal')}>Card &amp; invoices</button>
            <button className="linkbtn" disabled={busy} onClick={() => act('cancel')}>Cancel</button>
          </>
        )}
      </div>
      {msg && <div className="formmsg err">{msg}</div>}
    </div>
  );
}
