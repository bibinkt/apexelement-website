'use client';

import { useState } from 'react';

const LABELS = {
  price: 'Quoting a price',
  schedule: 'Promising a time',
  diagnosis: 'Diagnosing the fault',
  inventory: 'Claiming a part is in stock',
  coverage: 'Claiming warranty or insurance',
  safety: 'Telling someone to operate equipment',
  identity: 'Denying it is automated',
  invention: 'Stating unverified equipment facts',
};

export default function AdminPanels({ base = '', pricing, guardrails, protectedKeys }) {
  const [price, setPrice] = useState(pricing.monthly_usd);
  const [rails, setRails] = useState(guardrails);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function save(key, value, confirmed = false) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`${base}/api/admin/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, confirm: confirmed }),
      });
      const j = await r.json();
      if (r.status === 409 && j.needsConfirm) { setConfirm({ key, value, ...j }); return; }
      if (!j.ok) throw new Error(j.error || 'Could not save.');
      setMsg('Saved.'); setConfirm(null);
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  const toggle = (f) => {
    const next = { ...rails, forbid: { ...rails.forbid, [f]: !rails.forbid[f] } };
    setRails(next);
    save('guardrails', next);
  };

  return (
    <>
      <h2 className="dash-h2">Pricing</h2>
      <div className="panel" style={{ maxWidth: '520px' }}>
        <h3>Monthly price</h3>
        <p className="panel-lead">
          Checkout builds the price inline, so this takes effect on the next subscription with
          nothing to change in Stripe. Existing subscribers keep the price they signed up at.
        </p>
        <div className="pricerow">
          <span className="pricecur">$</span>
          <input className="wiz-input" type="number" min="1" step="1" value={price}
                 onChange={(e) => setPrice(Number(e.target.value))} />
          <button className="btn" disabled={busy}
                  onClick={() => save('pricing', { ...pricing, monthly_usd: price })}>
            Save
          </button>
        </div>
      </div>

      <h2 className="dash-h2">Guard rails</h2>
      <div className="dash-grid">
        <div className="panel">
          <h3>Thresholds</h3>
          <p className="panel-lead">Safe to tune. These change how hard it works, not what it may say.</p>
          {[
            ['confidence_threshold', 'Plate confidence', 0.5, 1, 0.05],
            ['max_reshoots', 'Photo retries', 0, 4, 1],
            ['max_turns', 'Max customer messages', 3, 15, 1],
            ['abandon_hours', 'Hours before a quiet job closes', 1, 72, 1],
          ].map(([k, label, min, max, step]) => (
            <div className="railrow" key={k}>
              <label>{label}</label>
              <input type="number" min={min} max={max} step={step} value={rails[k]}
                     onChange={(e) => setRails({ ...rails, [k]: Number(e.target.value) })} />
            </div>
          ))}
          <p style={{ marginTop: '14px' }}>
            <button className="btn" disabled={busy} onClick={() => save('guardrails', rails)}>Save thresholds</button>
          </p>
        </div>

        <div className="panel">
          <h3>What it may never say</h3>
          <p className="panel-lead">
            Each of these is enforced on every outbound message. Switching one off is how a
            customer ends up quoted a price nobody agreed to, so it asks first.
          </p>
          {Object.keys(LABELS).map((f) => (
            <div className="railtoggle" key={f}>
              <div>
                <b>{LABELS[f]}</b>
                <span>{protectedKeys[`forbid.${f}`]}</span>
              </div>
              <button className={`switch${rails.forbid?.[f] ? ' on' : ''}`} disabled={busy}
                      onClick={() => toggle(f)} aria-pressed={!!rails.forbid?.[f]}>
                {rails.forbid?.[f] ? 'Blocked' : 'ALLOWED'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {msg && <div className="formmsg ok" style={{ display: 'block' }}>{msg}</div>}

      {confirm && (
        <div className="confirmwrap">
          <div className="confirmbox">
            <h3>You are switching off a guard rail</h3>
            <p>Once this is off, the assistant is allowed to do the following in a message to a customer:</p>
            <ul>
              {confirm.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p className="confirmfine">
              This is logged against {`${''}`}your admin account. Existing conversations are unaffected;
              it applies from the next message sent.
            </p>
            <div className="confirmact">
              <button className="btn btn-ghost" onClick={() => { setConfirm(null); setRails(guardrails); }}>
                Keep it on
              </button>
              <button className="btn danger" onClick={() => save(confirm.key, confirm.value, true)}>
                I understand — switch it off
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
